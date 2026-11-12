-- Opportunity Find — automated opportunity discovery, verification and expiry
--
-- Requires schema.sql and 20261112000000_opportunity_events.sql
-- (public.is_current_user_admin()). Additive and rerunnable:
--   * adds NULLABLE / DEFAULTED columns to public.opportunities (existing rows
--     and the existing RLS policies are untouched; existing manual listings get
--     status = 'active', exactly as they behave today)
--   * creates opportunity_sources and sourcing_runs (RLS, admin-only)
--   * creates the expiry function and pg_cron schedules that call the
--     `opportunity-sourcing` Edge Function through pg_net
--
-- Security
--   * The Edge Function writes with the service role (server-side only).
--   * Scheduled calls are authenticated with a random secret generated here
--     and kept in Supabase Vault; it never leaves the server. Admins can also
--     trigger runs with their own session (checked inside the function).
--   * Nothing new is granted to anon.

-- ── extensions ───────────────────────────────────────────────────────────
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- ── sources ──────────────────────────────────────────────────────────────
create table if not exists public.opportunity_sources (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text not null unique check (slug ~ '^[a-z0-9-]{2,60}$'),
  name                  text not null,
  kind                  text not null check (kind in ('remotive', 'himalayas', 'jobicy', 'remoteok', 'greenhouse', 'ashby', 'lever', 'rss')),
  config                jsonb not null default '{}'::jsonb,
  enabled               boolean not null default true,
  -- true only for sources whose records can be verified automatically
  -- (official employer boards, structured job APIs). Aggregator feeds go to
  -- the admin review queue instead.
  auto_publish          boolean not null default false,
  min_interval_minutes  int not null default 120 check (min_interval_minutes between 0 and 10080),
  attribution           text not null default '',
  last_run_at           timestamptz,
  last_success_at       timestamptz,
  last_error            text,
  consecutive_failures  int not null default 0,
  last_stats            jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now()
);

create table if not exists public.sourcing_runs (
  id           bigint generated always as identity primary key,
  job          text not null check (job in ('discover', 'maintain', 'expire')),
  trigger      text not null check (trigger in ('schedule', 'manual')),
  source_slug  text,
  status       text not null default 'running' check (status in ('running', 'success', 'partial', 'failed', 'skipped')),
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  stats        jsonb not null default '{}'::jsonb,
  error        text
);

create index if not exists sourcing_runs_started_idx on public.sourcing_runs (started_at desc);
create index if not exists sourcing_runs_job_status_idx on public.sourcing_runs (job, status, started_at desc);

-- ── opportunities: provenance, verification and lifecycle columns ────────
alter table public.opportunities
  add column if not exists status            text not null default 'active',
  add column if not exists source_id         uuid references public.opportunity_sources (id) on delete set null,
  add column if not exists source_name       text,
  add column if not exists source_external_id text,
  add column if not exists source_url        text,
  add column if not exists canonical_url     text,
  add column if not exists discovered_at     timestamptz,
  add column if not exists last_seen_at      timestamptz,
  add column if not exists last_verified_at  timestamptz,
  add column if not exists link_status       text not null default 'unchecked',
  add column if not exists link_checked_at   timestamptz,
  add column if not exists review_reason     text,
  add column if not exists eligibility       text,
  add column if not exists country           text,
  add column if not exists work_mode         text,
  add column if not exists archived_at       timestamptz,
  add column if not exists auto_classified   boolean not null default false;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'opportunities_status_check') then
    alter table public.opportunities add constraint opportunities_status_check
      check (status in ('active', 'pending_review', 'archived', 'rejected'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'opportunities_link_status_check') then
    alter table public.opportunities add constraint opportunities_link_status_check
      check (link_status in ('unchecked', 'ok', 'broken', 'unknown'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'opportunities_work_mode_check') then
    alter table public.opportunities add constraint opportunities_work_mode_check
      check (work_mode is null or work_mode in ('remote', 'onsite', 'hybrid'));
  end if;
end $$;

create unique index if not exists opportunities_source_external_key
  on public.opportunities (source_id, source_external_id)
  where source_id is not null and source_external_id is not null;
create index if not exists opportunities_canonical_url_idx on public.opportunities (canonical_url);
create index if not exists opportunities_status_idx on public.opportunities (status);

-- Publishing a pending/archived/rejected record (e.g. an admin approving it
-- with the existing editor) makes it active again.
create or replace function public.opportunity_status_on_publish()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_published and not coalesce(old.is_published, false)
     and new.status in ('pending_review', 'archived', 'rejected') then
    new.status := 'active';
    new.archived_at := null;
    new.review_reason := null;
  end if;
  return new;
end;
$$;

drop trigger if exists opportunities_status_on_publish on public.opportunities;
create trigger opportunities_status_on_publish
  before update on public.opportunities
  for each row execute function public.opportunity_status_on_publish();

-- ── RLS for the new tables (admin read; admins may toggle sources) ───────
alter table public.opportunity_sources enable row level security;
alter table public.sourcing_runs enable row level security;
revoke all on public.opportunity_sources, public.sourcing_runs from public, anon, authenticated;
grant select on public.opportunity_sources, public.sourcing_runs to authenticated;
grant update (enabled, auto_publish) on public.opportunity_sources to authenticated;

drop policy if exists "admins read sources" on public.opportunity_sources;
create policy "admins read sources" on public.opportunity_sources for select to authenticated
  using (public.is_current_user_admin());
drop policy if exists "admins toggle sources" on public.opportunity_sources;
create policy "admins toggle sources" on public.opportunity_sources for update to authenticated
  using (public.is_current_user_admin()) with check (public.is_current_user_admin());
drop policy if exists "admins read runs" on public.sourcing_runs;
create policy "admins read runs" on public.sourcing_runs for select to authenticated
  using (public.is_current_user_admin());

-- ── run locking (prevents overlapping scheduled/manual runs) ─────────────
-- Returns the new run id, or null when the same job is already running
-- (runs older than 15 minutes are treated as dead and marked failed).
create or replace function public.start_sourcing_run(p_job text, p_trigger text, p_source_slug text default null)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id bigint;
begin
  perform pg_advisory_xact_lock(hashtext('opportunity-sourcing:' || p_job));
  update public.sourcing_runs
     set status = 'failed', finished_at = now(), error = coalesce(error, 'Timed out (no completion recorded)')
   where job = p_job and status = 'running' and started_at < now() - interval '15 minutes';
  if exists (select 1 from public.sourcing_runs where job = p_job and status = 'running') then
    return null;
  end if;
  insert into public.sourcing_runs (job, trigger, source_slug) values (p_job, p_trigger, p_source_slug)
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.start_sourcing_run(text, text, text) from public, anon, authenticated;
grant execute on function public.start_sourcing_run(text, text, text) to service_role;

-- ── expiry / archiving (pure SQL, runs on its own schedule) ──────────────
-- Never deletes. Archived records stay in the table for admins.
create or replace function public.archive_expired_opportunities(p_trigger text default 'schedule')
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deadline int;
  v_unlisted int;
  v_stale    int;
  v_stats    jsonb;
begin
  -- Same rule as the frontend's isExpired(): deadline in the past.
  update public.opportunities
     set is_published = false, status = 'archived', archived_at = now(),
         review_reason = 'Deadline passed'
   where status in ('active', 'pending_review') and deadline is not null and deadline < now()
     and (is_published or status = 'pending_review');
  get diagnostics v_deadline = row_count;

  -- Imported listings without a deadline: archive once the source stops
  -- listing them (not seen for 3 days).
  update public.opportunities
     set is_published = false, status = 'archived', archived_at = now(),
         review_reason = 'No longer listed by the source'
   where status = 'active' and source_id is not null and deadline is null
     and last_seen_at is not null and last_seen_at < now() - interval '3 days';
  get diagnostics v_unlisted = row_count;

  -- Pending imports nobody reviewed for 30 days.
  update public.opportunities
     set status = 'archived', archived_at = now(), review_reason = 'Not reviewed within 30 days'
   where status = 'pending_review' and source_id is not null
     and discovered_at < now() - interval '30 days';
  get diagnostics v_stale = row_count;

  v_stats := jsonb_build_object('archived_deadline', v_deadline, 'archived_unlisted', v_unlisted, 'archived_unreviewed', v_stale);
  insert into public.sourcing_runs (job, trigger, status, finished_at, stats)
  values ('expire', case when p_trigger = 'manual' then 'manual' else 'schedule' end, 'success', now(), v_stats);
  return v_stats;
end;
$$;

revoke all on function public.archive_expired_opportunities(text) from public, anon, authenticated;
grant execute on function public.archive_expired_opportunities(text) to service_role;

-- Admin "run expiry now" from the dashboard.
create or replace function public.admin_run_expiry()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_current_user_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return public.archive_expired_opportunities('manual');
end;
$$;

revoke all on function public.admin_run_expiry() from public, anon;
grant execute on function public.admin_run_expiry() to authenticated;

-- ── scheduler secret + invocation ────────────────────────────────────────
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'sourcing_cron_secret') then
    perform vault.create_secret(
      replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
      'sourcing_cron_secret',
      'Authenticates pg_cron calls to the opportunity-sourcing Edge Function');
  end if;
  if not exists (select 1 from vault.secrets where name = 'sourcing_function_url') then
    perform vault.create_secret(
      'https://xdrijanrthekahkjzcjy.supabase.co/functions/v1/opportunity-sourcing',
      'sourcing_function_url',
      'URL of the opportunity-sourcing Edge Function');
  end if;
end $$;

-- Lets the Edge Function (service role only) compare the header it received.
create or replace function public.get_sourcing_cron_secret()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'sourcing_cron_secret';
$$;

revoke all on function public.get_sourcing_cron_secret() from public, anon, authenticated;
grant execute on function public.get_sourcing_cron_secret() to service_role;

create or replace function public.invoke_opportunity_sourcing(p_job text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url    text;
  v_secret text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'sourcing_function_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'sourcing_cron_secret';
  return net.http_post(
    url := v_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', v_secret),
    body := jsonb_build_object('job', p_job, 'trigger', 'schedule'),
    timeout_milliseconds := 5000
  );
end;
$$;

revoke all on function public.invoke_opportunity_sourcing(text) from public, anon, authenticated;

-- ── admin monitoring ─────────────────────────────────────────────────────
create or replace function public.admin_sourcing_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_current_user_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'counts', (select jsonb_build_object(
        'active_published',  count(*) filter (where status = 'active' and is_published),
        'pending_review',    count(*) filter (where status = 'pending_review'),
        'archived',          count(*) filter (where status = 'archived'),
        'rejected',          count(*) filter (where status = 'rejected'),
        'imported_total',    count(*) filter (where source_id is not null),
        'imported_active',   count(*) filter (where source_id is not null and status = 'active' and is_published),
        'discovered_24h',    count(*) filter (where discovered_at > now() - interval '24 hours'),
        'broken_links',      count(*) filter (where link_status = 'broken' and status in ('active', 'pending_review')),
        'unverified_links',  count(*) filter (where link_status = 'unknown' and status = 'active' and is_published)
      ) from public.opportunities),
    'last_success', (select jsonb_object_agg(job, last_ok) from (
        select job, max(finished_at) as last_ok from public.sourcing_runs where status in ('success', 'partial') group by job) s),
    'schedules', (select coalesce(jsonb_agg(jsonb_build_object('name', jobname, 'schedule', schedule, 'active', active) order by jobname), '[]'::jsonb)
                  from cron.job where jobname like 'opportunity-%'),
    'runs', (select coalesce(jsonb_agg(to_jsonb(r) order by r.started_at desc), '[]'::jsonb)
             from (select id, job, trigger, source_slug, status, started_at, finished_at, stats, error
                   from public.sourcing_runs order by started_at desc limit 25) r)
  );
end;
$$;

revoke all on function public.admin_sourcing_overview() from public, anon;
grant execute on function public.admin_sourcing_overview() to authenticated;

-- ── initial sources (all free, no API key) ───────────────────────────────
insert into public.opportunity_sources (slug, name, kind, config, auto_publish, min_interval_minutes, attribution) values
  ('remotive', 'Remotive', 'remotive',
   '{"url": "https://remotive.com/api/remote-jobs"}', true, 360,
   'Remote jobs from Remotive (remotive.com). Listings link back to Remotive as required by its API terms.'),
  ('himalayas', 'Himalayas', 'himalayas',
   '{"url": "https://himalayas.app/jobs/api", "pages": 5}', true, 180,
   'Remote jobs from Himalayas (himalayas.app).'),
  ('jobicy', 'Jobicy', 'jobicy',
   '{"url": "https://jobicy.com/api/v2/remote-jobs?count=100"}', true, 180,
   'Remote jobs from Jobicy (jobicy.com).'),
  ('remoteok', 'Remote OK', 'remoteok',
   '{"url": "https://remoteok.com/api"}', true, 360,
   'Remote jobs from Remote OK (remoteok.com). Listings link back to Remote OK as required by its API terms.'),
  ('moniepoint-careers', 'Moniepoint (official careers)', 'greenhouse',
   '{"board": "moniepoint", "company": "Moniepoint"}', true, 180,
   'Official Moniepoint job board (Greenhouse).'),
  ('lemfi-careers', 'LemFi (official careers)', 'ashby',
   '{"board": "lemfi", "company": "LemFi"}', true, 180,
   'Official LemFi job board (Ashby).'),
  ('andela-careers', 'Andela (official careers)', 'ashby',
   '{"board": "andela", "company": "Andela"}', true, 180,
   'Official Andela job board (Ashby).'),
  ('opportunity-desk', 'Opportunity Desk (RSS)', 'rss',
   '{"url": "https://opportunitydesk.org/feed/"}', false, 180,
   'Scholarships, fellowships, grants and competitions from the Opportunity Desk RSS feed. Third-party summaries: always reviewed by an admin before publishing.'),
  ('opportunities-for-africans', 'Opportunities For Africans (RSS)', 'rss',
   '{"url": "https://www.opportunitiesforafricans.com/feed/"}', false, 180,
   'Opportunities for Africans RSS feed. Third-party summaries: always reviewed by an admin before publishing.'),
  ('scholars4dev', 'Scholars4Dev (RSS)', 'rss',
   '{"url": "https://www.scholars4dev.com/feed/", "default_type": "scholarship"}', false, 360,
   'Scholarships for students from developing countries (scholars4dev.com RSS). Always reviewed before publishing.')
on conflict (slug) do nothing;

-- ── schedules (pg_cron, UTC) ─────────────────────────────────────────────
do $$
declare
  j text;
begin
  foreach j in array array['opportunity-discovery', 'opportunity-maintenance', 'opportunity-expiry'] loop
    perform cron.unschedule(jobid) from cron.job where jobname = j;
  end loop;
end $$;

-- Discovery 8x daily; sources also enforce their own minimum interval.
select cron.schedule('opportunity-discovery', '15 */3 * * *', $$select public.invoke_opportunity_sourcing('discover')$$);
-- Link / source re-verification daily (02:45 WAT).
select cron.schedule('opportunity-maintenance', '45 1 * * *', $$select public.invoke_opportunity_sourcing('maintain')$$);
-- Deadline expiry 4x daily (at least daily required).
select cron.schedule('opportunity-expiry', '30 */6 * * *', $$select public.archive_expired_opportunities('schedule')$$);

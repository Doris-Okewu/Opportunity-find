-- Opportunity Find — anonymous opportunity event tracking + admin analytics
--
-- Additive and rerunnable: creates new objects only, never alters or drops
-- the existing `opportunities` / `admins` tables or their policies.
-- Run in Supabase Dashboard > SQL Editor AFTER schema.sql has been applied.
--
-- Security model
--   * `opportunity_events` has RLS enabled and NO policies, and all table
--     privileges are revoked from anon/authenticated. Nobody can read or
--     write rows through the API directly — admins included.
--   * Writes go only through `track_opportunity_event` (SECURITY DEFINER),
--     which validates input, only accepts events for published
--     opportunities, stores a SHA-256 hash of the browser visitor id (never
--     the raw id), and de-duplicates repeat events within 30 minutes.
--   * Reads go only through `admin_analytics_*` functions (SECURITY
--     DEFINER) which raise unless auth.uid() is in `admins`, and return
--     aggregate counts only — no visitor hashes, no individual rows.
--   * Every SECURITY DEFINER function pins `search_path = ''` and
--     schema-qualifies every table reference, so objects created in any
--     client-writable schema can never be picked up.
--   * Hashing uses built-in pg_catalog.sha256 (PG 11+), so no dependency on
--     where pgcrypto is installed.
--
-- Known limitation: anonymous tracking can be inflated by a client that
-- rotates visitor ids; counts are indicative, not audited.
--
-- ── Read-only preflight (optional, run first) ────────────────────────────
--   select current_setting('server_version_num')::int >= 110000;  -> true
--   select to_regclass('public.opportunities'), to_regclass('public.admins');  -> both non-null
--   select count(*) from public.admins;  -> at least 1
--   select to_regclass('public.opportunity_events');  -> null before first run (rerun is safe)

-- ── table ────────────────────────────────────────────────────────────────

create table if not exists public.opportunity_events (
  id              bigint generated always as identity primary key,
  opportunity_id  uuid not null references public.opportunities (id) on delete cascade,
  event_type      text not null check (event_type in ('detail_view', 'apply_click')),
  visitor_hash    text not null check (char_length(visitor_hash) = 64),
  created_at      timestamptz not null default now()
);

create index if not exists opportunity_events_created_idx
  on public.opportunity_events (created_at desc);

create index if not exists opportunity_events_dedupe_idx
  on public.opportunity_events (visitor_hash, opportunity_id, event_type, created_at desc);

alter table public.opportunity_events enable row level security;
revoke all on table public.opportunity_events from public, anon, authenticated;
revoke all on sequence public.opportunity_events_id_seq from public, anon, authenticated;

-- ── shared helper ────────────────────────────────────────────────────────
-- Returns only whether the CALLER is an admin. Granted to anon as well so it
-- can be used inside RLS policies evaluated for anonymous requests (it just
-- returns false for them).

create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

revoke all on function public.is_current_user_admin() from public;
grant execute on function public.is_current_user_admin() to anon, authenticated;

-- ── write path: anonymous tracking RPC ───────────────────────────────────

create or replace function public.track_opportunity_event(
  p_opportunity_id uuid,
  p_event_type     text,
  p_visitor_id     text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hash text;
begin
  -- Explicit NULL checks: `NULL not in (...)` is NULL, not true.
  if p_opportunity_id is null
     or p_event_type is null
     or p_event_type not in ('detail_view', 'apply_click')
     or p_visitor_id is null
     or char_length(p_visitor_id) not between 16 and 64 then
    return; -- silently ignore malformed input; tracking must never error the client
  end if;

  if not exists (
    select 1 from public.opportunities o
    where o.id = p_opportunity_id and o.is_published = true
  ) then
    return;
  end if;

  v_hash := encode(pg_catalog.sha256(convert_to(p_visitor_id, 'UTF8')), 'hex');

  if exists (
    select 1 from public.opportunity_events e
    where e.visitor_hash = v_hash
      and e.opportunity_id = p_opportunity_id
      and e.event_type = p_event_type
      and e.created_at > now() - interval '30 minutes'
  ) then
    return;
  end if;

  insert into public.opportunity_events (opportunity_id, event_type, visitor_hash)
  values (p_opportunity_id, p_event_type, v_hash);
end;
$$;

revoke all on function public.track_opportunity_event(uuid, text, text) from public;
grant execute on function public.track_opportunity_event(uuid, text, text) to anon, authenticated;

-- ── read path: admin-only aggregates ─────────────────────────────────────
-- All three functions share one window: the last p_days whole UTC calendar
-- days including today (p_days clamped to 1–365), so totals, the
-- per-opportunity table and the daily chart always agree.

create or replace function public.admin_analytics_summary(p_days int default 30)
returns table (
  detail_views     bigint,
  unique_viewers   bigint,
  apply_clicks     bigint,
  unique_appliers  bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_days  int := greatest(1, least(coalesce(p_days, 30), 365));
  v_start timestamptz := (((now() at time zone 'utc')::date - (v_days - 1))::timestamp at time zone 'utc');
begin
  if not public.is_current_user_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  return query
  select
    count(*) filter (where e.event_type = 'detail_view'),
    count(distinct e.visitor_hash) filter (where e.event_type = 'detail_view'),
    count(*) filter (where e.event_type = 'apply_click'),
    count(distinct e.visitor_hash) filter (where e.event_type = 'apply_click')
  from public.opportunity_events e
  where e.created_at >= v_start;
end;
$$;

create or replace function public.admin_analytics_by_opportunity(p_days int default 30)
returns table (
  opportunity_id   uuid,
  title            text,
  organization     text,
  is_published     boolean,
  deadline         timestamptz,
  detail_views     bigint,
  unique_viewers   bigint,
  apply_clicks     bigint,
  unique_appliers  bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_days  int := greatest(1, least(coalesce(p_days, 30), 365));
  v_start timestamptz := (((now() at time zone 'utc')::date - (v_days - 1))::timestamp at time zone 'utc');
begin
  if not public.is_current_user_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  return query
  with agg as (
    select
      e.opportunity_id as opp_id,
      count(*) filter (where e.event_type = 'detail_view')                    as v,
      count(distinct e.visitor_hash) filter (where e.event_type = 'detail_view') as uv,
      count(*) filter (where e.event_type = 'apply_click')                    as a,
      count(distinct e.visitor_hash) filter (where e.event_type = 'apply_click') as ua
    from public.opportunity_events e
    where e.created_at >= v_start
    group by e.opportunity_id
  )
  select
    o.id, o.title, o.organization, o.is_published, o.deadline,
    coalesce(agg.v, 0), coalesce(agg.uv, 0), coalesce(agg.a, 0), coalesce(agg.ua, 0)
  from public.opportunities o
  left join agg on agg.opp_id = o.id
  order by coalesce(agg.v, 0) desc, coalesce(agg.a, 0) desc, o.created_at desc;
end;
$$;

-- Daily totals, one row per UTC day in the window (zero-filled). Events are
-- aggregated with a sargable range filter first, then joined to an integer
-- day series, so the result doesn't depend on the session TimeZone.
create or replace function public.admin_analytics_daily(p_days int default 30)
returns table (
  day           date,
  detail_views  bigint,
  apply_clicks  bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_days      int  := greatest(1, least(coalesce(p_days, 30), 365));
  v_first_day date := (now() at time zone 'utc')::date - (v_days - 1);
  v_start     timestamptz := (v_first_day::timestamp at time zone 'utc');
begin
  if not public.is_current_user_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  return query
  with agg as (
    select
      (e.created_at at time zone 'utc')::date              as utc_day,
      count(*) filter (where e.event_type = 'detail_view') as v,
      count(*) filter (where e.event_type = 'apply_click') as a
    from public.opportunity_events e
    where e.created_at >= v_start
    group by 1
  ),
  days as (
    select v_first_day + g as series_day
    from generate_series(0, v_days - 1) as g
  )
  select days.series_day, coalesce(agg.v, 0), coalesce(agg.a, 0)
  from days
  left join agg on agg.utc_day = days.series_day
  order by days.series_day;
end;
$$;

-- Supabase's default privileges grant EXECUTE on new public functions to
-- anon explicitly, so revoking from PUBLIC alone is not enough.
revoke all on function public.admin_analytics_summary(int) from public, anon;
revoke all on function public.admin_analytics_by_opportunity(int) from public, anon;
revoke all on function public.admin_analytics_daily(int) from public, anon;
grant execute on function public.admin_analytics_summary(int) to authenticated;
grant execute on function public.admin_analytics_by_opportunity(int) to authenticated;
grant execute on function public.admin_analytics_daily(int) to authenticated;

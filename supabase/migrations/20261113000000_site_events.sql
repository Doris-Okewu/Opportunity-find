-- Opportunity Find — product-usage analytics for the pilot (site_events)
--
-- Requires: schema.sql, 20261112000000_opportunity_events.sql (for
-- public.is_current_user_admin()) and 20261112010000_community.sql.
-- Additive and rerunnable: creates new objects only. Does not alter or drop
-- any existing table, policy or function.
--
-- Security model (same as opportunity_events)
--   * site_events has RLS enabled, NO policies, and no table privileges for
--     anon/authenticated: nobody reads or writes rows through the API.
--   * Writes go only through track_site_event (SECURITY DEFINER), which
--     validates input, stores a SHA-256 hash of the browser visitor/session
--     ids (never the raw ids), accepts only short lowercase detail codes (no
--     free text, so no search terms, notes or emails can be stored),
--     de-duplicates, and rate-limits per visitor.
--   * user_kind is derived server-side from auth.uid(), never from the client.
--     No user id or email is stored.
--   * Reads go only through admin_engagement_* functions, which raise unless
--     the caller is an admin and return aggregate counts only. Admin traffic
--     is excluded from site_events counts.

create table if not exists public.site_events (
  id              bigint generated always as identity primary key,
  event_type      text not null check (event_type in (
                    'visit_start', 'page_view', 'search', 'filter_change',
                    'onboarding_complete', 'preferences_updated',
                    'recommendations_view', 'recommendation_click',
                    'tracker_add', 'tracker_status_change', 'sign_in')),
  visitor_hash    text not null check (char_length(visitor_hash) = 64),
  session_hash    text not null check (char_length(session_hash) = 64),
  user_kind       text not null check (user_kind in ('anonymous', 'registered', 'member', 'admin')),
  detail          text not null default '' check (detail ~ '^[a-z0-9_:/.-]{0,80}$'),
  opportunity_id  uuid references public.opportunities (id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists site_events_created_idx on public.site_events (created_at desc);
create index if not exists site_events_visitor_idx on public.site_events (visitor_hash, created_at desc);
create index if not exists site_events_session_idx on public.site_events (session_hash, event_type);

alter table public.site_events enable row level security;
revoke all on table public.site_events from public, anon, authenticated;
revoke all on sequence public.site_events_id_seq from public, anon, authenticated;

-- ── write path ───────────────────────────────────────────────────────────

create or replace function public.track_site_event(
  p_event_type      text,
  p_visitor_id      text,
  p_session_id      text,
  p_detail          text default '',
  p_opportunity_id  uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_visitor  text;
  v_session  text;
  v_detail   text := coalesce(p_detail, '');
  v_kind     text;
  v_opp      uuid := null;
  v_uid      uuid := auth.uid();
begin
  -- Tracking must never error the client: malformed input is ignored.
  if p_event_type is null
     or p_event_type not in ('visit_start', 'page_view', 'search', 'filter_change',
                             'onboarding_complete', 'preferences_updated',
                             'recommendations_view', 'recommendation_click',
                             'tracker_add', 'tracker_status_change', 'sign_in')
     or p_visitor_id is null or char_length(p_visitor_id) not between 16 and 64
     or p_session_id is null or char_length(p_session_id) not between 16 and 64 then
    return;
  end if;

  if v_detail !~ '^[a-z0-9_:/.-]{0,80}$' then
    v_detail := '';
  end if;

  -- sign_in is only meaningful for an authenticated caller.
  if p_event_type = 'sign_in' and v_uid is null then
    return;
  end if;

  if p_opportunity_id is not null then
    select o.id into v_opp from public.opportunities o
    where o.id = p_opportunity_id and o.is_published = true;
  end if;

  v_visitor := encode(pg_catalog.sha256(convert_to(p_visitor_id, 'UTF8')), 'hex');
  v_session := encode(pg_catalog.sha256(convert_to(p_session_id, 'UTF8')), 'hex');

  if v_uid is null then
    v_kind := 'anonymous';
  elsif exists (select 1 from public.admins a where a.user_id = v_uid) then
    v_kind := 'admin';
  elsif exists (select 1 from public.community_members m where m.user_id = v_uid) then
    v_kind := 'member';
  else
    v_kind := 'registered';
  end if;

  -- Rate limit: at most 300 events per visitor per hour.
  if (select count(*) from public.site_events e
      where e.visitor_hash = v_visitor and e.created_at > now() - interval '1 hour') >= 300 then
    return;
  end if;

  -- De-duplication.
  if p_event_type = 'visit_start' then
    if exists (select 1 from public.site_events e
               where e.session_hash = v_session and e.event_type = 'visit_start') then
      return;
    end if;
  elsif exists (
    select 1 from public.site_events e
    where e.visitor_hash = v_visitor
      and e.event_type = p_event_type
      and e.detail = v_detail
      and e.opportunity_id is not distinct from v_opp
      and e.created_at > now() - case
            when p_event_type in ('page_view', 'recommendations_view') then interval '1 minute'
            else interval '5 seconds'
          end
  ) then
    return;
  end if;

  insert into public.site_events (event_type, visitor_hash, session_hash, user_kind, detail, opportunity_id)
  values (p_event_type, v_visitor, v_session, v_kind, v_detail, v_opp);
end;
$$;

revoke all on function public.track_site_event(text, text, text, text, uuid) from public;
grant execute on function public.track_site_event(text, text, text, text, uuid) to anon, authenticated;

-- ── read path: admin-only aggregates ─────────────────────────────────────
-- Same window as the opportunity analytics: the last p_days whole UTC days
-- including today (p_days clamped to 1–365).

create or replace function public.admin_engagement_summary(p_days int default 30)
returns table (metric text, value bigint)
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
  with se as (
    select * from public.site_events e
    where e.created_at >= v_start and e.user_kind <> 'admin'
  ),
  oe as (
    select * from public.opportunity_events e where e.created_at >= v_start
  )
  select 'unique_visitors', (select count(*) from (
            select visitor_hash from se union select visitor_hash from oe) v)
  union all select 'visits',                  (select count(*) from se where event_type = 'visit_start')
  union all select 'page_views',              (select count(*) from se where event_type = 'page_view')
  union all select 'visitors_anonymous',      (select count(distinct visitor_hash) from se where user_kind = 'anonymous')
  union all select 'visitors_registered',     (select count(distinct visitor_hash) from se where user_kind = 'registered')
  union all select 'visitors_member',         (select count(distinct visitor_hash) from se where user_kind = 'member')
  union all select 'opportunity_views',       (select count(*) from oe where event_type = 'detail_view')
  union all select 'opportunity_viewers',     (select count(distinct visitor_hash) from oe where event_type = 'detail_view')
  union all select 'apply_clicks',            (select count(*) from oe where event_type = 'apply_click')
  union all select 'searches',                (select count(*) from se where event_type = 'search')
  union all select 'searchers',               (select count(distinct visitor_hash) from se where event_type = 'search')
  union all select 'filter_changes',          (select count(*) from se where event_type = 'filter_change')
  union all select 'filter_users',            (select count(distinct visitor_hash) from se where event_type = 'filter_change')
  union all select 'onboarding_completions',  (select count(*) from se where event_type = 'onboarding_complete')
  union all select 'preferences_updates',     (select count(*) from se where event_type = 'preferences_updated')
  union all select 'recommendation_views',    (select count(*) from se where event_type = 'recommendations_view')
  union all select 'recommendation_viewers',  (select count(distinct visitor_hash) from se where event_type = 'recommendations_view')
  union all select 'recommendation_clicks',   (select count(*) from se where event_type = 'recommendation_click')
  union all select 'tracker_adds',            (select count(*) from se where event_type = 'tracker_add')
  union all select 'tracker_users',           (select count(distinct visitor_hash) from se where event_type = 'tracker_add')
  union all select 'tracker_status_changes',  (select count(*) from se where event_type = 'tracker_status_change')
  union all select 'sign_ins',                (select count(*) from se where event_type = 'sign_in')
  -- Authoritative counts from the database itself (not client events).
  union all select 'accounts_created',        (select count(*) from auth.users u where u.created_at >= v_start
                                                 and not exists (select 1 from public.admins a where a.user_id = u.id))
  union all select 'accounts_confirmed',      (select count(*) from auth.users u where u.created_at >= v_start
                                                 and u.email_confirmed_at is not null
                                                 and not exists (select 1 from public.admins a where a.user_id = u.id))
  union all select 'profiles_created',        (select count(*) from public.profiles p where p.created_at >= v_start)
  union all select 'community_joins',         (select count(*) from public.community_members m where m.joined_at >= v_start)
  union all select 'community_posts',         (select count(*) from public.community_posts p where p.created_at >= v_start)
  union all select 'community_comments',      (select count(*) from public.community_comments c where c.created_at >= v_start)
  union all select 'content_reports',         (select count(*) from public.content_reports r where r.created_at >= v_start);
end;
$$;

-- Activity by UTC day and feature (only non-zero cells are returned).
create or replace function public.admin_engagement_daily(p_days int default 30)
returns table (day date, feature text, events bigint, unique_visitors bigint)
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
  with ev as (
    select (e.created_at at time zone 'utc')::date as d,
           case
             when e.event_type = 'visit_start' then 'visits'
             when e.event_type = 'page_view' then 'page_views'
             when e.event_type in ('search', 'filter_change') then 'search_filter'
             when e.event_type in ('onboarding_complete', 'preferences_updated',
                                   'recommendations_view', 'recommendation_click') then 'recommendations'
             when e.event_type in ('tracker_add', 'tracker_status_change') then 'tracker'
             else 'sign_ins'
           end as f,
           e.visitor_hash as v
    from public.site_events e
    where e.created_at >= v_start and e.user_kind <> 'admin'
    union all
    select (e.created_at at time zone 'utc')::date,
           case when e.event_type = 'detail_view' then 'opportunity_views' else 'apply_clicks' end,
           e.visitor_hash
    from public.opportunity_events e
    where e.created_at >= v_start
    union all
    select (p.created_at at time zone 'utc')::date, 'community_posts', null from public.community_posts p where p.created_at >= v_start
    union all
    select (c.created_at at time zone 'utc')::date, 'community_comments', null from public.community_comments c where c.created_at >= v_start
    union all
    select (m.joined_at at time zone 'utc')::date, 'community_joins', null from public.community_members m where m.joined_at >= v_start
  )
  select ev.d, ev.f, count(*), count(distinct ev.v)
  from ev
  group by ev.d, ev.f
  order by ev.d, ev.f;
end;
$$;

-- Which pages, filters, onboarding paths and tracker statuses are used.
-- Detail values are short non-personal codes by construction.
create or replace function public.admin_engagement_breakdown(p_days int default 30)
returns table (event_type text, detail text, events bigint, unique_visitors bigint)
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
  select e.event_type, e.detail, count(*), count(distinct e.visitor_hash)
  from public.site_events e
  where e.created_at >= v_start
    and e.user_kind <> 'admin'
    and e.event_type in ('page_view', 'filter_change', 'onboarding_complete', 'preferences_updated', 'tracker_status_change')
  group by e.event_type, e.detail
  order by e.event_type, count(*) desc
  limit 200;
end;
$$;

revoke all on function public.admin_engagement_summary(int) from public, anon;
revoke all on function public.admin_engagement_daily(int) from public, anon;
revoke all on function public.admin_engagement_breakdown(int) from public, anon;
grant execute on function public.admin_engagement_summary(int) to authenticated;
grant execute on function public.admin_engagement_daily(int) to authenticated;
grant execute on function public.admin_engagement_breakdown(int) to authenticated;

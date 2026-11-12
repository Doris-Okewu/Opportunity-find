-- Opportunity Find — Community MVP
--
-- Field communities, membership, posts, comments, opportunity-specific
-- discussions, content reports and admin moderation.
--
-- Requires: schema.sql and 20261112000000_opportunity_events.sql (for
-- public.is_current_user_admin()). Additive and rerunnable: only creates new
-- objects; policies are dropped-if-exists before being recreated. Does not
-- alter `opportunities`, `admins` or their policies.
--
-- Access summary
--   anon:          read communities, visible posts/comments, display names
--   authenticated: + own profile, join/leave, post (members only for
--                  community posts; any signed-in user for opportunity
--                  discussions), comment, delete own content, report
--   admins:        + read hidden content and reports, hide/unhide, delete
--                  any content, resolve/dismiss reports, manage communities
--
-- Supabase Auth must allow email sign-ups (Authentication > Providers >
-- Email) for non-admin users to join.

-- ── profiles (public display name; never exposes email) ──────────────────

create table if not exists public.profiles (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  display_name  text not null check (
                  char_length(display_name) between 2 and 40
                  and display_name = btrim(display_name)
                ),
  created_at    timestamptz not null default now()
);

create unique index if not exists profiles_display_name_lower_key
  on public.profiles (lower(display_name));

-- ── communities ──────────────────────────────────────────────────────────

create table if not exists public.communities (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  name         text not null check (char_length(name) between 2 and 80),
  description  text not null default '' check (char_length(description) <= 500),
  career_slug  text,
  created_at   timestamptz not null default now()
);

create table if not exists public.community_members (
  community_id  uuid not null references public.communities (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  joined_at     timestamptz not null default now(),
  primary key (community_id, user_id)
);

create index if not exists community_members_user_idx on public.community_members (user_id);

-- ── posts (community post XOR opportunity discussion) ───────────────────

create table if not exists public.community_posts (
  id              uuid primary key default gen_random_uuid(),
  community_id    uuid references public.communities (id) on delete cascade,
  opportunity_id  uuid references public.opportunities (id) on delete cascade,
  author_id       uuid not null references public.profiles (user_id) on delete cascade,
  title           text not null check (char_length(btrim(title)) between 3 and 150),
  body            text not null check (char_length(btrim(body)) between 1 and 5000),
  is_hidden       boolean not null default false,
  created_at      timestamptz not null default now(),
  constraint community_posts_one_target check (num_nonnulls(community_id, opportunity_id) = 1)
);

create index if not exists community_posts_community_idx
  on public.community_posts (community_id, created_at desc) where community_id is not null;
create index if not exists community_posts_opportunity_idx
  on public.community_posts (opportunity_id, created_at desc) where opportunity_id is not null;
create index if not exists community_posts_author_idx
  on public.community_posts (author_id, created_at desc);

create table if not exists public.community_comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.community_posts (id) on delete cascade,
  author_id   uuid not null references public.profiles (user_id) on delete cascade,
  body        text not null check (char_length(btrim(body)) between 1 and 2000),
  is_hidden   boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists community_comments_post_idx on public.community_comments (post_id, created_at);
create index if not exists community_comments_author_idx on public.community_comments (author_id, created_at desc);

-- ── reports ──────────────────────────────────────────────────────────────

create table if not exists public.content_reports (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid references public.community_posts (id) on delete cascade,
  comment_id   uuid references public.community_comments (id) on delete cascade,
  reporter_id  uuid not null references auth.users (id) on delete cascade,
  reason       text not null check (reason in ('spam', 'harassment', 'scam', 'misinformation', 'off_topic', 'other')),
  details      text not null default '' check (char_length(details) <= 500),
  status       text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz,
  resolved_by  uuid references auth.users (id) on delete set null,
  constraint content_reports_one_target check (num_nonnulls(post_id, comment_id) = 1)
);

create unique index if not exists content_reports_reporter_post_key
  on public.content_reports (reporter_id, post_id) where post_id is not null;
create unique index if not exists content_reports_reporter_comment_key
  on public.content_reports (reporter_id, comment_id) where comment_id is not null;
create index if not exists content_reports_status_idx on public.content_reports (status, created_at desc);

-- ── helper functions ─────────────────────────────────────────────────────

create or replace function public.is_community_member(p_community_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.community_members m
    where m.community_id = p_community_id and m.user_id = auth.uid()
  );
$$;

-- Can the caller comment on this post? Post must be visible (not hidden),
-- and either be an opportunity discussion on a published opportunity, or
-- belong to a community the caller has joined.
create or replace function public.can_comment_on_post(p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.community_posts p
    where p.id = p_post_id
      and p.is_hidden = false
      and (
        (p.opportunity_id is not null and exists (
          select 1 from public.opportunities o where o.id = p.opportunity_id and o.is_published = true))
        or (p.community_id is not null and exists (
          select 1 from public.community_members m
          where m.community_id = p.community_id and m.user_id = auth.uid()))
      )
  );
$$;

revoke all on function public.is_community_member(uuid) from public;
revoke all on function public.can_comment_on_post(uuid) from public;
grant execute on function public.is_community_member(uuid) to anon, authenticated;
grant execute on function public.can_comment_on_post(uuid) to anon, authenticated;

-- Community list with aggregate counts and the caller's membership.
-- Exposes counts only, never member identities.
create or replace function public.community_summaries()
returns table (
  id            uuid,
  slug          text,
  name          text,
  description   text,
  career_slug   text,
  member_count  bigint,
  post_count    bigint,
  is_member     boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id, c.slug, c.name, c.description, c.career_slug,
    (select count(*) from public.community_members m where m.community_id = c.id),
    (select count(*) from public.community_posts p where p.community_id = c.id and p.is_hidden = false),
    exists (select 1 from public.community_members m where m.community_id = c.id and m.user_id = auth.uid())
  from public.communities c
  order by c.name;
$$;

revoke all on function public.community_summaries() from public;
grant execute on function public.community_summaries() to anon, authenticated;

-- ── rate limits (per author, rolling hour) ───────────────────────────────

create or replace function public.enforce_community_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  if public.is_current_user_admin() then
    return new;
  end if;

  if tg_table_name = 'community_posts' then
    select count(*) into v_count from public.community_posts
      where author_id = new.author_id and created_at > now() - interval '1 hour';
    if v_count >= 10 then
      raise exception 'Posting limit reached (10 posts per hour). Please try again later.' using errcode = 'P0001';
    end if;
  elsif tg_table_name = 'community_comments' then
    select count(*) into v_count from public.community_comments
      where author_id = new.author_id and created_at > now() - interval '1 hour';
    if v_count >= 30 then
      raise exception 'Comment limit reached (30 comments per hour). Please try again later.' using errcode = 'P0001';
    end if;
  elsif tg_table_name = 'content_reports' then
    select count(*) into v_count from public.content_reports
      where reporter_id = new.reporter_id and created_at > now() - interval '1 hour';
    if v_count >= 20 then
      raise exception 'Report limit reached. Please try again later.' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_community_rate_limit() from public, anon, authenticated;

drop trigger if exists community_posts_rate_limit on public.community_posts;
create trigger community_posts_rate_limit before insert on public.community_posts
  for each row execute function public.enforce_community_rate_limit();

drop trigger if exists community_comments_rate_limit on public.community_comments;
create trigger community_comments_rate_limit before insert on public.community_comments
  for each row execute function public.enforce_community_rate_limit();

drop trigger if exists content_reports_rate_limit on public.content_reports;
create trigger content_reports_rate_limit before insert on public.content_reports
  for each row execute function public.enforce_community_rate_limit();

-- ── row level security ───────────────────────────────────────────────────

alter table public.profiles           enable row level security;
alter table public.communities        enable row level security;
alter table public.community_members  enable row level security;
alter table public.community_posts    enable row level security;
alter table public.community_comments enable row level security;
alter table public.content_reports    enable row level security;

-- Table privileges: start from nothing, grant only what each role needs
-- (Supabase's default privileges otherwise grant ALL to anon/authenticated).
revoke all on public.profiles, public.communities, public.community_members,
  public.community_posts, public.community_comments, public.content_reports
  from public, anon, authenticated;

grant select on public.profiles, public.communities, public.community_posts, public.community_comments
  to anon, authenticated;
grant insert on public.profiles, public.community_members, public.community_posts,
  public.community_comments, public.content_reports to authenticated;
grant update (display_name) on public.profiles to authenticated;
grant insert, update, delete on public.communities to authenticated;          -- admins only, via RLS
grant select, delete on public.community_members to authenticated;
grant delete on public.community_posts, public.community_comments to authenticated;
grant update (is_hidden) on public.community_posts, public.community_comments to authenticated;  -- admins only, via RLS
grant select on public.content_reports to authenticated;                       -- admins only, via RLS
grant update (status, resolved_at, resolved_by) on public.content_reports to authenticated;  -- admins only, via RLS

-- profiles
drop policy if exists "profiles readable by all" on public.profiles;
create policy "profiles readable by all" on public.profiles for select using (true);

drop policy if exists "users create own profile" on public.profiles;
create policy "users create own profile" on public.profiles for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- communities
drop policy if exists "communities readable by all" on public.communities;
create policy "communities readable by all" on public.communities for select using (true);

drop policy if exists "admins insert communities" on public.communities;
create policy "admins insert communities" on public.communities for insert to authenticated
  with check (public.is_current_user_admin());

drop policy if exists "admins update communities" on public.communities;
create policy "admins update communities" on public.communities for update to authenticated
  using (public.is_current_user_admin()) with check (public.is_current_user_admin());

drop policy if exists "admins delete communities" on public.communities;
create policy "admins delete communities" on public.communities for delete to authenticated
  using (public.is_current_user_admin());

-- community_members (member identities are not public)
drop policy if exists "members read own membership" on public.community_members;
create policy "members read own membership" on public.community_members for select to authenticated
  using (user_id = auth.uid() or public.is_current_user_admin());

drop policy if exists "users join communities" on public.community_members;
create policy "users join communities" on public.community_members for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "users leave communities" on public.community_members;
create policy "users leave communities" on public.community_members for delete to authenticated
  using (user_id = auth.uid());

-- community_posts
drop policy if exists "visible posts readable" on public.community_posts;
create policy "visible posts readable" on public.community_posts for select
  using (is_hidden = false or author_id = auth.uid() or public.is_current_user_admin());

drop policy if exists "members create posts" on public.community_posts;
create policy "members create posts" on public.community_posts for insert to authenticated
  with check (
    author_id = auth.uid()
    and is_hidden = false
    and (
      (community_id is not null and public.is_community_member(community_id))
      or (opportunity_id is not null and exists (
        select 1 from public.opportunities o where o.id = opportunity_id and o.is_published = true))
    )
  );

drop policy if exists "authors or admins delete posts" on public.community_posts;
create policy "authors or admins delete posts" on public.community_posts for delete to authenticated
  using (author_id = auth.uid() or public.is_current_user_admin());

drop policy if exists "admins moderate posts" on public.community_posts;
create policy "admins moderate posts" on public.community_posts for update to authenticated
  using (public.is_current_user_admin()) with check (public.is_current_user_admin());

-- community_comments (also hidden when the parent post isn't readable)
drop policy if exists "visible comments readable" on public.community_comments;
create policy "visible comments readable" on public.community_comments for select
  using (
    (is_hidden = false or author_id = auth.uid() or public.is_current_user_admin())
    and exists (select 1 from public.community_posts p where p.id = post_id)
  );

drop policy if exists "participants create comments" on public.community_comments;
create policy "participants create comments" on public.community_comments for insert to authenticated
  with check (author_id = auth.uid() and is_hidden = false and public.can_comment_on_post(post_id));

drop policy if exists "authors or admins delete comments" on public.community_comments;
create policy "authors or admins delete comments" on public.community_comments for delete to authenticated
  using (author_id = auth.uid() or public.is_current_user_admin());

drop policy if exists "admins moderate comments" on public.community_comments;
create policy "admins moderate comments" on public.community_comments for update to authenticated
  using (public.is_current_user_admin()) with check (public.is_current_user_admin());

-- content_reports (reporters can file; only admins can read or act)
drop policy if exists "users file reports" on public.content_reports;
create policy "users file reports" on public.content_reports for insert to authenticated
  with check (reporter_id = auth.uid() and status = 'open' and resolved_at is null and resolved_by is null);

drop policy if exists "admins read reports" on public.content_reports;
create policy "admins read reports" on public.content_reports for select to authenticated
  using (public.is_current_user_admin());

drop policy if exists "admins update reports" on public.content_reports;
create policy "admins update reports" on public.content_reports for update to authenticated
  using (public.is_current_user_admin()) with check (public.is_current_user_admin());

-- ── field communities (one per existing career path) ────────────────────
-- These are empty discussion spaces, not content. Slugs match
-- src/features/careerEngine/careerPaths.ts.

insert into public.communities (slug, name, description, career_slug) values
  ('frontend',      'Frontend Engineering',       'Interfaces, web apps and websites — share resources, portfolios and questions.', 'frontend'),
  ('backend',       'Backend Engineering',        'Servers, APIs and databases — discuss learning paths, projects and interviews.', 'backend'),
  ('data',          'Data & Analytics',           'SQL, Python, dashboards and statistics — swap tips and project ideas.', 'data'),
  ('design',        'Product Design (UI/UX)',     'Research, wireframes and design systems — critique and career advice.', 'design'),
  ('product',       'Product Management',         'Strategy, roadmaps and stakeholder work — breaking into product.', 'product'),
  ('marketing',     'Digital Marketing & Growth', 'Content, SEO and campaigns — growth skills and opportunities.', 'marketing'),
  ('cybersecurity', 'Cybersecurity',              'Security fundamentals, certifications and ethical hacking practice.', 'cybersecurity'),
  ('devops',        'DevOps & Cloud',             'Infrastructure, CI/CD and cloud platforms — labs, certs and roles.', 'devops')
on conflict (slug) do nothing;

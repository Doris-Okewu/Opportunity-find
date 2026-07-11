-- Opportunity Find — database schema
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query).

create extension if not exists pgcrypto;

-- ── opportunities ────────────────────────────────────────────────────────

create table if not exists opportunities (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  organization      text not null,
  type              text not null check (
                      type in (
                        'job', 'internship', 'scholarship', 'nysc',
                        'fellowship', 'grant', 'competition', 'tech_program'
                      )
                    ),
  career_tags       text[] not null default '{}',
  required_skills   text[] not null default '{}',
  experience_level  text not null check (
                      experience_level in ('student', 'entry', 'intermediate', 'senior')
                    ),
  location          text,
  remote            boolean not null default false,
  description       text not null,
  application_url   text not null,
  deadline          timestamptz,
  is_published      boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists opportunities_is_published_idx on opportunities (is_published);
create index if not exists opportunities_deadline_idx on opportunities (deadline);
create index if not exists opportunities_career_tags_idx on opportunities using gin (career_tags);

-- keep updated_at current on every row change
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists opportunities_set_updated_at on opportunities;
create trigger opportunities_set_updated_at
  before update on opportunities
  for each row
  execute function set_updated_at();

-- ── admins ───────────────────────────────────────────────────────────────
-- Membership in this table grants full admin access to /admin.
-- Rows are added manually in the SQL Editor after creating a Supabase Auth user
-- (see the "admin bootstrap" instructions at the bottom of this file).

create table if not exists admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

-- ── row level security ──────────────────────────────────────────────────

alter table opportunities enable row level security;
alter table admins enable row level security;

-- Public (anon + authenticated) can read published opportunities only.
create policy "public read published opportunities"
  on opportunities for select
  using (is_published = true);

-- Admins can read every opportunity, published or not, expired or not.
create policy "admins read all opportunities"
  on opportunities for select
  using (exists (select 1 from admins where admins.user_id = auth.uid()));

-- Admins can create/update/delete opportunities.
create policy "admins write opportunities"
  on opportunities for insert
  with check (exists (select 1 from admins where admins.user_id = auth.uid()));

create policy "admins update opportunities"
  on opportunities for update
  using (exists (select 1 from admins where admins.user_id = auth.uid()))
  with check (exists (select 1 from admins where admins.user_id = auth.uid()));

create policy "admins delete opportunities"
  on opportunities for delete
  using (exists (select 1 from admins where admins.user_id = auth.uid()));

-- A user may check only their own admin membership row (needed so the
-- EXISTS(...) subqueries above can resolve under RLS). No one can list
-- or modify the admins table via the client.
create policy "self read own admin row"
  on admins for select
  using (user_id = auth.uid());

-- ── admin bootstrap ─────────────────────────────────────────────────────
-- 1. Supabase Dashboard > Authentication > Users > Add user
--    Create the admin's email + password there (or have them sign up once
--    from /admin/login if you build a one-time signup flow — for the MVP
--    we create the user directly in the dashboard instead).
-- 2. Copy the new user's UUID from that screen, then run:
--
--    insert into admins (user_id) values ('paste-user-uuid-here');

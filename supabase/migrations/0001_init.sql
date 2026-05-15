-- ──────────────────────────────────────────────────────────────────────────
-- WK 2026 Pronostiek — initial schema
--
-- Apply via either:
--   1. Supabase dashboard → SQL editor → New query → paste this file → Run.
--   2. CLI: supabase db push (requires `supabase link --project-ref kgcbgatxctfbsgkzrfea`).
--
-- Idempotent where reasonable (drops in the right order on re-run).
-- ──────────────────────────────────────────────────────────────────────────

-- ── Extensions ───────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Enums ────────────────────────────────────────────────────────────────
do $$ begin
  create type stage as enum ('group', 'r32', 'r16', 'qf', 'sf', 'third', 'final');
exception when duplicate_object then null; end $$;

do $$ begin
  create type match_status as enum (
    'SCHEDULED', 'IN_PLAY', 'PAUSED', 'FINISHED',
    'POSTPONED', 'CANCELLED', 'SUSPENDED'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type result_source as enum ('cron', 'admin');
exception when duplicate_object then null; end $$;

-- ── Tables ───────────────────────────────────────────────────────────────

create table if not exists teams (
  code      text primary key,
  name_nl   text not null,
  flag      text not null,
  is_host   boolean not null default false,
  is_home   boolean not null default false
);

create table if not exists venues (
  id      serial primary key,
  city    text not null,
  country text not null,
  name    text not null,
  cap     integer not null
);

create table if not exists matches (
  id                int primary key,
  stage             stage not null,
  group_id          char(1),
  kick_at           timestamptz not null,
  venue_id          integer references venues(id),
  home_team         text references teams(code),
  away_team         text references teams(code),
  home_slot         text,
  away_slot         text,
  home_score        integer,
  away_score        integer,
  status            match_status not null default 'SCHEDULED',
  external_id       text,
  result_entered_at timestamptz,
  result_source     result_source,
  check (home_score is null or home_score >= 0),
  check (away_score is null or away_score >= 0)
);
create index if not exists matches_kick_at_idx on matches (kick_at);
create index if not exists matches_status_idx on matches (status);
create index if not exists matches_external_id_idx on matches (external_id);

create table if not exists profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  team_name    text,
  is_admin     boolean not null default false,
  created_at   timestamptz not null default now()
);

create table if not exists predictions (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  match_id   int  not null references matches(id) on delete cascade,
  home_score int  not null check (home_score between 0 and 30),
  away_score int  not null check (away_score between 0 and 30),
  points     int,
  locked_at  timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, match_id)
);
create index if not exists predictions_match_idx on predictions (match_id);
create index if not exists predictions_user_idx on predictions (user_id);

create table if not exists scoring_rules (
  key   text primary key,
  value integer not null
);

create table if not exists cron_logs (
  id      bigserial primary key,
  ran_at  timestamptz not null default now(),
  job     text not null,
  checked int not null default 0,
  updated int not null default 0,
  errors  int not null default 0,
  detail  jsonb
);
create index if not exists cron_logs_ran_at_idx on cron_logs (ran_at desc);

-- ── Helpers ──────────────────────────────────────────────────────────────

-- SECURITY DEFINER so RLS on profiles doesn't recurse when policies on other
-- tables call this to check admin status.
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce((select is_admin from profiles where user_id = uid), false);
$$;

-- Auto-touch updated_at on predictions.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists predictions_touch on predictions;
create trigger predictions_touch
before update on predictions
for each row execute function public.touch_updated_at();

-- Auto-create a profile row on signup. Display name defaults to the local
-- part of the email so the user is never row-less, even if onboarding fails.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ── Row-Level Security ───────────────────────────────────────────────────
alter table teams         enable row level security;
alter table venues        enable row level security;
alter table matches       enable row level security;
alter table profiles      enable row level security;
alter table predictions   enable row level security;
alter table scoring_rules enable row level security;
alter table cron_logs     enable row level security;

-- Public-read reference tables.
drop policy if exists "teams readable by anyone" on teams;
create policy "teams readable by anyone" on teams for select using (true);

drop policy if exists "venues readable by anyone" on venues;
create policy "venues readable by anyone" on venues for select using (true);

drop policy if exists "matches readable by anyone" on matches;
create policy "matches readable by anyone" on matches for select using (true);

drop policy if exists "scoring_rules readable by anyone" on scoring_rules;
create policy "scoring_rules readable by anyone" on scoring_rules for select using (true);

-- Admin-only writes for reference tables.
drop policy if exists "matches writable by admin" on matches;
create policy "matches writable by admin" on matches
  for update using (public.is_admin(auth.uid()));

drop policy if exists "scoring_rules writable by admin" on scoring_rules;
create policy "scoring_rules writable by admin" on scoring_rules
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Profiles: anyone signed in can read display_name/team_name for leaderboard;
-- only own row can be updated.
drop policy if exists "profiles readable by anyone" on profiles;
create policy "profiles readable by anyone" on profiles for select using (true);

drop policy if exists "profiles updatable by owner" on profiles;
create policy "profiles updatable by owner" on profiles
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "profiles admin can update any" on profiles;
create policy "profiles admin can update any" on profiles
  for update using (public.is_admin(auth.uid()));

-- Predictions: the privacy-and-lock policies.
--
-- SELECT: own row, OR the match has kicked off (then it's public).
drop policy if exists "predictions visible to owner or after kickoff" on predictions;
create policy "predictions visible to owner or after kickoff" on predictions
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from matches m
      where m.id = predictions.match_id
        and m.kick_at <= now()
    )
  );

-- INSERT: own row, only if kickoff is still > 5 minutes away.
drop policy if exists "predictions insertable by owner before lock" on predictions;
create policy "predictions insertable by owner before lock" on predictions
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from matches m
      where m.id = predictions.match_id
        and m.kick_at > now() + interval '5 minutes'
    )
  );

-- UPDATE: same constraint.
drop policy if exists "predictions updatable by owner before lock" on predictions;
create policy "predictions updatable by owner before lock" on predictions
  for update using (
    user_id = auth.uid()
    and exists (
      select 1 from matches m
      where m.id = predictions.match_id
        and m.kick_at > now() + interval '5 minutes'
    )
  ) with check (user_id = auth.uid());

-- cron_logs: admin only.
drop policy if exists "cron_logs readable by admin" on cron_logs;
create policy "cron_logs readable by admin" on cron_logs
  for select using (public.is_admin(auth.uid()));

-- ── Seed scoring rules ──────────────────────────────────────────────────
insert into scoring_rules (key, value) values
  ('group_winner', 3),
  ('group_exact', 5),
  ('r32_winner', 5),
  ('r16_winner', 8),
  ('qf_winner', 12),
  ('sf_winner', 20),
  ('final_winner', 30),
  ('final_exact_bonus', 15),
  ('top_scorer', 25),
  ('dark_horse', 25)
on conflict (key) do nothing;

-- ── Leaderboard view ────────────────────────────────────────────────────
create or replace view leaderboard as
  select
    p.user_id,
    pr.display_name,
    pr.team_name,
    coalesce(sum(p.points), 0)::int as points,
    count(*) filter (where p.points is not null) as scored
  from predictions p
  join profiles pr on pr.user_id = p.user_id
  group by p.user_id, pr.display_name, pr.team_name;

grant select on leaderboard to anon, authenticated;

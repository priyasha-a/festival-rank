-- Run in your Supabase project: Dashboard → SQL Editor → New query → paste → Run.
-- Safe to run again after changes: everything below is "if not exists" / "drop if exists".

-- One row per user per festival: which sets they saw, artists they added, and their ranking.
create table if not exists public.festival_rankings (
  user_id     uuid        not null references auth.users (id) on delete cascade default auth.uid(),
  festival_id text        not null,
  seen        text[]      not null default '{}',
  custom      text[]      not null default '{}',
  ranked      text[]      not null default '{}',  -- best first
  updated_at  timestamptz not null default now(),
  primary key (user_id, festival_id)
);

-- Added later: "went, but too long ago to rank" festivals.
alter table public.festival_rankings add column if not exists attended_only boolean not null default false;

-- Row Level Security: the publishable key is public, so these policies are what keep
-- each user's data private. Users can only see and change their own rows.
alter table public.festival_rankings enable row level security;

drop policy if exists "Users read own rankings" on public.festival_rankings;
create policy "Users read own rankings" on public.festival_rankings
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users insert own rankings" on public.festival_rankings;
create policy "Users insert own rankings" on public.festival_rankings
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Users update own rankings" on public.festival_rankings;
create policy "Users update own rankings" on public.festival_rankings
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users delete own rankings" on public.festival_rankings;
create policy "Users delete own rankings" on public.festival_rankings
  for delete to authenticated using ((select auth.uid()) = user_id);


-- One row per user: the solo shows they logged (artist, venue, city, month, openers) and their
-- ranking of them as a list of show ids, best first.
create table if not exists public.user_shows (
  user_id    uuid        primary key references auth.users (id) on delete cascade default auth.uid(),
  shows      jsonb       not null default '[]',
  ranked     text[]      not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.user_shows enable row level security;

drop policy if exists "Users read own shows" on public.user_shows;
create policy "Users read own shows" on public.user_shows
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users insert own shows" on public.user_shows;
create policy "Users insert own shows" on public.user_shows
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Users update own shows" on public.user_shows;
create policy "Users update own shows" on public.user_shows
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users delete own shows" on public.user_shows;
create policy "Users delete own shows" on public.user_shows
  for delete to authenticated using ((select auth.uid()) = user_id);


-- ===================== Friends =====================

-- Public-facing identity. Signed-in users can look up usernames (to add friends); emails are never exposed.
create table if not exists public.profiles (
  id           uuid        primary key references auth.users (id) on delete cascade default auth.uid(),
  username     text        not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text        not null check (char_length(display_name) between 1 and 40),
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Signed-in users look up profiles" on public.profiles;
create policy "Signed-in users look up profiles" on public.profiles
  for select to authenticated using (true);

drop policy if exists "Users create own profile" on public.profiles;
create policy "Users create own profile" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Mutual friendships: a pending request until the other person accepts.
create table if not exists public.friendships (
  id         uuid        primary key default gen_random_uuid(),
  requester  uuid        not null references public.profiles (id) on delete cascade default auth.uid(),
  addressee  uuid        not null references public.profiles (id) on delete cascade,
  status     text        not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  check (requester <> addressee)
);

-- One friendship per pair of people, whoever asked first.
create unique index if not exists friendships_one_per_pair
  on public.friendships (least(requester, addressee), greatest(requester, addressee));

alter table public.friendships enable row level security;

drop policy if exists "People see their own friendships" on public.friendships;
create policy "People see their own friendships" on public.friendships
  for select to authenticated using ((select auth.uid()) in (requester, addressee));

drop policy if exists "People send requests as themselves" on public.friendships;
create policy "People send requests as themselves" on public.friendships
  for insert to authenticated with check ((select auth.uid()) = requester and status = 'pending');

drop policy if exists "Only the recipient accepts" on public.friendships;
create policy "Only the recipient accepts" on public.friendships
  for update to authenticated
  using ((select auth.uid()) = addressee)
  with check ((select auth.uid()) = addressee and status = 'accepted');

drop policy if exists "Either person can remove" on public.friendships;
create policy "Either person can remove" on public.friendships
  for delete to authenticated using ((select auth.uid()) in (requester, addressee));

-- Accepting may only change the status, never who the friendship is between.
revoke update on public.friendships from anon, authenticated;
grant update (status) on public.friendships to authenticated;

-- True when the signed-in user and `other` are accepted friends.
create or replace function public.is_friend(other uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.requester = (select auth.uid()) and f.addressee = other)
        or (f.addressee = (select auth.uid()) and f.requester = other))
  );
$$;

-- Friends can read (never change) each other's rankings and shows.
drop policy if exists "Friends read rankings" on public.festival_rankings;
create policy "Friends read rankings" on public.festival_rankings
  for select to authenticated using (public.is_friend(user_id));

drop policy if exists "Friends read shows" on public.user_shows;
create policy "Friends read shows" on public.user_shows
  for select to authenticated using (public.is_friend(user_id));


-- ===================== User-added festivals & requests =====================

-- A festival a user added themselves is stored like any other festival record, with its details here.
alter table public.festival_rankings add column if not exists custom_meta jsonb;

-- "Please add this festival" requests. Users can submit, but only you (in the dashboard) can read them.
create table if not exists public.festival_requests (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        references auth.users (id) on delete set null default auth.uid(),
  name       text        not null check (char_length(name) between 1 and 80),
  year       int         not null check (year between 1990 and 2100),
  location   text        not null default '',
  dates      text        not null default '',
  artists    text[]      not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.festival_requests enable row level security;

drop policy if exists "Anyone can request a festival" on public.festival_requests;
create policy "Anyone can request a festival" on public.festival_requests
  for insert to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()));

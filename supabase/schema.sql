-- Run this once in your Supabase project: Dashboard → SQL Editor → New query → paste → Run.

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

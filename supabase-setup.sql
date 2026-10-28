-- Run once in Supabase Dashboard > SQL Editor to enable real account sync.
-- Use only the project's anon/public key in supabase-config.js. Never use service_role.
create table if not exists public.biobot_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.biobot_profiles enable row level security;
drop policy if exists "Players read own BioBot profile" on public.biobot_profiles;
create policy "Players read own BioBot profile" on public.biobot_profiles
  for select to authenticated using (auth.uid() = id);
drop policy if exists "Players save own BioBot profile" on public.biobot_profiles;
create policy "Players save own BioBot profile" on public.biobot_profiles
  for insert to authenticated with check (auth.uid() = id);
drop policy if exists "Players update own BioBot profile" on public.biobot_profiles;
create policy "Players update own BioBot profile" on public.biobot_profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
grant select, insert, update on public.biobot_profiles to authenticated;

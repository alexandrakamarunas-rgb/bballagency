-- ══════════════════════════════════════════════════════════════════════════════
-- BBALLAGENCY — Migration 002: Agents & Teams
-- Run in: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists public.agents (
  id               uuid primary key references public.profiles(id) on delete cascade,
  first_name       text,
  last_name        text,
  phone            text,
  whatsapp         text,
  agency_name      text,
  years_experience integer,
  countries        text[],
  languages        text[],
  bio              text,
  photo_url        text,
  created_at       timestamptz default now()
);

create table if not exists public.teams (
  id             uuid primary key references public.profiles(id) on delete cascade,
  club_name      text not null,
  country        text,
  city           text,
  founded_year   integer,
  league_name    text,
  league_level   text,
  season         text,
  open_positions text[],
  budget_range   text,
  requirements   text,
  logo_url       text,
  created_at     timestamptz default now()
);

-- RLS
alter table public.agents enable row level security;
alter table public.teams  enable row level security;

create policy "agents: public read"  on public.agents for select using (true);
create policy "agents: own insert"   on public.agents for insert with check (auth.uid() = id);
create policy "agents: own update"   on public.agents for update using (auth.uid() = id);

create policy "teams: public read"   on public.teams  for select using (true);
create policy "teams: own insert"    on public.teams  for insert with check (auth.uid() = id);
create policy "teams: own update"    on public.teams  for update using (auth.uid() = id);

-- Storage policies for new buckets
-- Create buckets first: Dashboard → Storage → New bucket
-- "agent-photos" (public: ON)  "team-logos" (public: ON)

create policy "agent-photos: public read" on storage.objects
  for select using (bucket_id = 'agent-photos');
create policy "agent-photos: auth upload" on storage.objects
  for insert with check (bucket_id = 'agent-photos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "agent-photos: auth update" on storage.objects
  for update using (bucket_id = 'agent-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "team-logos: public read" on storage.objects
  for select using (bucket_id = 'team-logos');
create policy "team-logos: auth upload" on storage.objects
  for insert with check (bucket_id = 'team-logos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "team-logos: auth update" on storage.objects
  for update using (bucket_id = 'team-logos' and auth.uid()::text = (storage.foldername(name))[1]);

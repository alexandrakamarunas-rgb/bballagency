-- ══════════════════════════════════════════════════════════════════════════════
-- BBALLAGENCY.COM — Full Schema
-- Run in: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Tables ───────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  role       text not null default 'player' check (role in ('player', 'team', 'agent')),
  created_at timestamptz default now()
);

create table if not exists public.players (
  id             uuid primary key references public.profiles(id) on delete cascade,
  first_name     text not null,
  last_name      text not null,
  position       text,
  height_cm      integer,
  weight_kg      integer,
  date_of_birth  date,
  nationality    text,
  jersey_number  integer,
  current_team   text,
  photo_url      text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create table if not exists public.player_stats (
  id           uuid primary key default gen_random_uuid(),
  player_id    uuid not null references public.players(id) on delete cascade,
  season       text not null,
  team         text not null,
  league       text not null,
  games_played integer not null default 0,
  ppg          numeric(5,2) not null default 0,
  rpg          numeric(5,2) not null default 0,
  apg          numeric(5,2) not null default 0,
  fg_pct       numeric(5,4) not null default 0,
  three_pct    numeric(5,4) not null default 0,
  ft_pct       numeric(5,4) not null default 0,
  created_at   timestamptz default now()
);

create table if not exists public.player_highlights (
  id         uuid primary key default gen_random_uuid(),
  player_id  uuid not null references public.players(id) on delete cascade,
  title      text not null,
  video_url  text not null,
  created_at timestamptz default now()
);

-- ── Row Level Security ────────────────────────────────────────────────────────

alter table public.profiles         enable row level security;
alter table public.players          enable row level security;
alter table public.player_stats     enable row level security;
alter table public.player_highlights enable row level security;

-- profiles
create policy "profiles: own select"  on public.profiles for select  using (auth.uid() = id);
create policy "profiles: own insert"  on public.profiles for insert  with check (auth.uid() = id);
create policy "profiles: own update"  on public.profiles for update  using (auth.uid() = id);

-- players: public read, own write
create policy "players: public read"  on public.players  for select  using (true);
create policy "players: own insert"   on public.players  for insert  with check (auth.uid() = id);
create policy "players: own update"   on public.players  for update  using (auth.uid() = id);

-- player_stats: public read, own write
create policy "stats: public read"    on public.player_stats for select using (true);
create policy "stats: own insert"     on public.player_stats for insert
  with check (auth.uid() = player_id);
create policy "stats: own update"     on public.player_stats for update
  using (auth.uid() = player_id);
create policy "stats: own delete"     on public.player_stats for delete
  using (auth.uid() = player_id);

-- player_highlights: public read, own write
create policy "highlights: public read"  on public.player_highlights for select using (true);
create policy "highlights: own insert"   on public.player_highlights for insert
  with check (auth.uid() = player_id);
create policy "highlights: own delete"   on public.player_highlights for delete
  using (auth.uid() = player_id);

-- ── Auto-create profile on signup ─────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'player')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Auto-update updated_at ────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists players_updated_at on public.players;
create trigger players_updated_at
  before update on public.players
  for each row execute procedure public.set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- STORAGE: run after creating the bucket in the Supabase Dashboard
-- Dashboard → Storage → New bucket → "player-photos" → Public: ON
-- Then run these policies:
-- ══════════════════════════════════════════════════════════════════════════════

-- insert into storage.buckets (id, name, public) values ('player-photos', 'player-photos', true)
-- on conflict do nothing;

create policy "player-photos: public read" on storage.objects
  for select using (bucket_id = 'player-photos');

create policy "player-photos: auth upload" on storage.objects
  for insert with check (
    bucket_id = 'player-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "player-photos: auth update" on storage.objects
  for update using (
    bucket_id = 'player-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

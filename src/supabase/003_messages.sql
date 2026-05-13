-- ══════════════════════════════════════════════════════════════════════════════
-- BBALLAGENCY — Migration 003: Messages & Agent-Players
-- Run in: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists public.messages (
  id         uuid default gen_random_uuid() primary key,
  from_id    uuid references public.profiles(id) on delete cascade,
  to_id      uuid references public.profiles(id) on delete cascade,
  subject    text,
  body       text not null,
  read       boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.agent_players (
  id         uuid default gen_random_uuid() primary key,
  agent_id   uuid references public.profiles(id) on delete cascade,
  player_id  uuid references public.players(id) on delete cascade,
  created_at timestamptz default now(),
  unique(agent_id, player_id)
);

-- RLS
alter table public.messages      enable row level security;
alter table public.agent_players enable row level security;

create policy "messages: participants read" on public.messages
  for select using (auth.uid() = from_id or auth.uid() = to_id);
create policy "messages: own insert" on public.messages
  for insert with check (auth.uid() = from_id);
create policy "messages: recipient update" on public.messages
  for update using (auth.uid() = to_id);

create policy "agent_players: public read"  on public.agent_players for select using (true);
create policy "agent_players: own insert"   on public.agent_players for insert with check (auth.uid() = agent_id);
create policy "agent_players: own delete"   on public.agent_players for delete using (auth.uid() = agent_id);

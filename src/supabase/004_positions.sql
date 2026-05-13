-- ══════════════════════════════════════════════════════════════════════════════
-- BBALLAGENCY — Migration 004: Positions
-- Run in: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists public.positions (
  id           uuid default gen_random_uuid() primary key,
  team_id      uuid not null references public.teams(id) on delete cascade,
  position     text not null,
  budget_range text,
  requirements text,
  is_active    boolean default true,
  created_at   timestamptz default now()
);

alter table public.positions enable row level security;

create policy "positions: public read"  on public.positions for select using (true);
create policy "positions: team insert"  on public.positions for insert with check (auth.uid() = team_id);
create policy "positions: team update"  on public.positions for update using (auth.uid() = team_id);
create policy "positions: team delete"  on public.positions for delete using (auth.uid() = team_id);

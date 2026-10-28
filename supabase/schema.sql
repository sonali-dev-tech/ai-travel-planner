-- Run this in Supabase Dashboard > SQL Editor
create extension if not exists "pgcrypto";

create table if not exists public.trips (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  destination   text not null,
  start_date    date,
  days          int  not null check (days between 1 and 14),
  budget        numeric not null,
  currency      text not null default 'INR',
  travel_style  text,
  prefs         jsonb not null default '{}'::jsonb,
  itinerary     jsonb not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists trips_user_idx on public.trips(user_id, created_at desc);

-- Row Level Security: har user sirf apne trips dekh/edit kar sake
alter table public.trips enable row level security;

create policy "own trips select" on public.trips for select using (auth.uid() = user_id);
create policy "own trips insert" on public.trips for insert with check (auth.uid() = user_id);
create policy "own trips update" on public.trips for update using (auth.uid() = user_id);
create policy "own trips delete" on public.trips for delete using (auth.uid() = user_id);

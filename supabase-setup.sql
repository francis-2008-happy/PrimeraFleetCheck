-- Supabase setup for Primera Fleet Check.
-- Run this once in: Supabase dashboard > SQL Editor > New query > Run.

-- 1. The table. One row per vehicle check-in.
--    The CHECK rules stop bad data being saved, even by a buggy app.
create table public.checkins (
  id          uuid primary key default gen_random_uuid(),
  vehicle     text not null check (char_length(vehicle) > 0),
  odometer    integer not null check (odometer between 0 and 9999999),
  fuel_level  text not null check (fuel_level in ('Full', '3/4', '1/2', '1/4', 'Low')),
  defects     text[] not null default '{}',
  resolved    boolean not null default false,
  notes       text not null default '' check (char_length(notes) <= 2000),
  date        date not null default current_date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);

-- 2. Security. Row Level Security blocks every request unless a policy allows it.
--    These policies allow signed-in users only (the app signs in anonymously).
alter table public.checkins enable row level security;

create policy "Signed-in users can read check-ins"
  on public.checkins for select to authenticated using (true);

create policy "Signed-in users can add check-ins"
  on public.checkins for insert to authenticated with check (true);

create policy "Signed-in users can edit check-ins"
  on public.checkins for update to authenticated using (true) with check (true);

create policy "Signed-in users can delete check-ins"
  on public.checkins for delete to authenticated using (true);

-- 3. Realtime. Tells Supabase to send live notifications to the app
--    whenever a row in this table is inserted, updated or deleted.
alter publication supabase_realtime add table public.checkins;

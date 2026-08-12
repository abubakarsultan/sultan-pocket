-- Sultan Pocket Wallet storage
-- Run this once in Supabase SQL Editor.
-- This does NOT delete Supabase Auth users or profile metadata.

create table if not exists public.wallet_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{"nextId":1,"transactions":[],"customCategories":[]}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.wallet_data enable row level security;

drop policy if exists "wallet_data_select_own" on public.wallet_data;
create policy "wallet_data_select_own"
on public.wallet_data for select
using (auth.uid() = user_id);

drop policy if exists "wallet_data_insert_own" on public.wallet_data;
create policy "wallet_data_insert_own"
on public.wallet_data for insert
with check (auth.uid() = user_id);

drop policy if exists "wallet_data_update_own" on public.wallet_data;
create policy "wallet_data_update_own"
on public.wallet_data for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists wallet_data_updated_at_idx
on public.wallet_data(updated_at);

-- Optional TEST-DATA RESET:
-- Run ONLY when you intentionally want to remove all Wallet test data.
-- This keeps Auth accounts and profiles untouched.
-- delete from public.wallet_data;

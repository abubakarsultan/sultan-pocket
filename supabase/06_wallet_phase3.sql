-- Sultan Pocket Phase 3
-- Run this in Supabase SQL Editor before using recurring transactions,
-- merchant search, and the full data export.

alter table public.wallet_transactions
  add column if not exists merchant text;

create table if not exists public.wallet_recurring (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  amount numeric not null,
  day_of_month int not null check (day_of_month between 1 and 28),
  category text,
  method text,
  source text,
  person text,
  notes text,
  details jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.wallet_recurring enable row level security;

drop policy if exists "Users manage own recurring rules" on public.wallet_recurring;
create policy "Users manage own recurring rules"
on public.wallet_recurring
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists wallet_recurring_user_active_day_idx
  on public.wallet_recurring(user_id, active, day_of_month);

-- Sultan Pocket Savings Goals
-- Run this in the Supabase SQL Editor before using /dashboard/goals.

create table if not exists public.wallet_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric not null check (target_amount > 0),
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wallet_goals enable row level security;

drop policy if exists "Users manage own savings goals" on public.wallet_goals;
create policy "Users manage own savings goals"
on public.wallet_goals
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists wallet_goals_user_date_idx
  on public.wallet_goals(user_id, target_date);

create or replace function public.set_wallet_goals_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists wallet_goals_updated_at on public.wallet_goals;
create trigger wallet_goals_updated_at
before update on public.wallet_goals
for each row execute function public.set_wallet_goals_updated_at();

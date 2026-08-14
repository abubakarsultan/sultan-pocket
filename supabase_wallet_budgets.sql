-- Sultan Pocket Budget Planner
-- Run this in the Supabase SQL Editor before using /dashboard/budget.

create table if not exists public.wallet_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  month text not null check (month ~ '^\\d{4}-(0[1-9]|1[0-2])$'),
  limit_amount numeric not null check (limit_amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category, month)
);

alter table public.wallet_budgets enable row level security;

drop policy if exists "Users manage own budgets" on public.wallet_budgets;
create policy "Users manage own budgets"
on public.wallet_budgets
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists wallet_budgets_user_month_idx
  on public.wallet_budgets(user_id, month);

create or replace function public.set_wallet_budgets_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists wallet_budgets_updated_at on public.wallet_budgets;
create trigger wallet_budgets_updated_at
before update on public.wallet_budgets
for each row execute function public.set_wallet_budgets_updated_at();

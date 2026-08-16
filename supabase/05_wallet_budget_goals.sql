create table if not exists public.wallet_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  month text not null,
  limit_amount numeric(14,2) not null check (limit_amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, category, month),
  constraint wallet_budgets_month_check check (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$')
);

create table if not exists public.wallet_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  target_amount numeric(14,2) not null check (target_amount > 0),
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wallet_budgets enable row level security;
alter table public.wallet_goals enable row level security;

drop policy if exists "wallet_budgets_select_own" on public.wallet_budgets;
drop policy if exists "wallet_budgets_insert_own" on public.wallet_budgets;
drop policy if exists "wallet_budgets_update_own" on public.wallet_budgets;
drop policy if exists "wallet_budgets_delete_own" on public.wallet_budgets;
create policy "wallet_budgets_select_own" on public.wallet_budgets for select using (auth.uid() = user_id);
create policy "wallet_budgets_insert_own" on public.wallet_budgets for insert with check (auth.uid() = user_id);
create policy "wallet_budgets_update_own" on public.wallet_budgets for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "wallet_budgets_delete_own" on public.wallet_budgets for delete using (auth.uid() = user_id);

drop policy if exists "wallet_goals_select_own" on public.wallet_goals;
drop policy if exists "wallet_goals_insert_own" on public.wallet_goals;
drop policy if exists "wallet_goals_update_own" on public.wallet_goals;
drop policy if exists "wallet_goals_delete_own" on public.wallet_goals;
create policy "wallet_goals_select_own" on public.wallet_goals for select using (auth.uid() = user_id);
create policy "wallet_goals_insert_own" on public.wallet_goals for insert with check (auth.uid() = user_id);
create policy "wallet_goals_update_own" on public.wallet_goals for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "wallet_goals_delete_own" on public.wallet_goals for delete using (auth.uid() = user_id);

create index if not exists wallet_budgets_user_month_idx on public.wallet_budgets(user_id, month);
create index if not exists wallet_goals_user_idx on public.wallet_goals(user_id, created_at);

create table if not exists public.wallet_bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  amount numeric(14,2) not null check (amount > 0),
  due_day integer not null check (due_day between 1 and 31),
  category text not null default 'Other',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wallet_bills enable row level security;

drop policy if exists "wallet_bills_select_own" on public.wallet_bills;
drop policy if exists "wallet_bills_insert_own" on public.wallet_bills;
drop policy if exists "wallet_bills_update_own" on public.wallet_bills;
drop policy if exists "wallet_bills_delete_own" on public.wallet_bills;
create policy "wallet_bills_select_own" on public.wallet_bills for select using (auth.uid() = user_id);
create policy "wallet_bills_insert_own" on public.wallet_bills for insert with check (auth.uid() = user_id);
create policy "wallet_bills_update_own" on public.wallet_bills for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "wallet_bills_delete_own" on public.wallet_bills for delete using (auth.uid() = user_id);

create index if not exists wallet_bills_user_due_idx on public.wallet_bills(user_id, due_day);

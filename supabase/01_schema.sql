-- Sultan Pocket production schema
-- Run this in the Supabase SQL Editor before deploying this build.
-- This Wallet version stores each transaction/category as its own row.
-- The legacy wallet_data JSONB table is no longer used by the app.

create extension if not exists pgcrypto;

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  amount numeric(14,2) not null check (amount > 0),
  date date not null,
  category text,
  method text,
  source text,
  person text,
  notes text,
  repay_required boolean not null default true,
  from_account text,
  destination text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wallet_transactions_user_date_idx
  on public.wallet_transactions(user_id, date desc, created_at desc);
create index if not exists wallet_transactions_user_type_idx
  on public.wallet_transactions(user_id, type);

create table if not exists public.wallet_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income','expense')),
  created_at timestamptz not null default now(),
  unique(user_id, name, type)
);

create index if not exists wallet_categories_user_idx
  on public.wallet_categories(user_id, type, created_at);

create or replace function public.set_wallet_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists wallet_transactions_updated_at on public.wallet_transactions;
create trigger wallet_transactions_updated_at
before update on public.wallet_transactions
for each row execute function public.set_wallet_updated_at();

alter table public.wallet_transactions enable row level security;
alter table public.wallet_categories enable row level security;

drop policy if exists "wallet_transactions_select_own" on public.wallet_transactions;
create policy "wallet_transactions_select_own" on public.wallet_transactions
for select using (auth.uid() = user_id);

drop policy if exists "wallet_transactions_insert_own" on public.wallet_transactions;
create policy "wallet_transactions_insert_own" on public.wallet_transactions
for insert with check (auth.uid() = user_id);

drop policy if exists "wallet_transactions_update_own" on public.wallet_transactions;
create policy "wallet_transactions_update_own" on public.wallet_transactions
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "wallet_transactions_delete_own" on public.wallet_transactions;
create policy "wallet_transactions_delete_own" on public.wallet_transactions
for delete using (auth.uid() = user_id);

drop policy if exists "wallet_categories_select_own" on public.wallet_categories;
create policy "wallet_categories_select_own" on public.wallet_categories
for select using (auth.uid() = user_id);

drop policy if exists "wallet_categories_insert_own" on public.wallet_categories;
create policy "wallet_categories_insert_own" on public.wallet_categories
for insert with check (auth.uid() = user_id);

drop policy if exists "wallet_categories_update_own" on public.wallet_categories;
create policy "wallet_categories_update_own" on public.wallet_categories
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "wallet_categories_delete_own" on public.wallet_categories;
create policy "wallet_categories_delete_own" on public.wallet_categories
for delete using (auth.uid() = user_id);

-- Account deletion helper. Auth users cannot be deleted directly from the browser
-- with the anon/publishable key, so this security-definer function performs it safely.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;

-- Optional one-time cleanup for old testing data. Do NOT run this if legacy data is needed.
-- delete from public.wallet_data;

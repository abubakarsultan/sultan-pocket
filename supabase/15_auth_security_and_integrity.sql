-- Sultan Pocket P2 auth + integrity hardening.
-- Run once after the existing numbered migrations (01-14).
-- Safe to re-run.

alter table public.profiles add column if not exists password_set boolean not null default false;

-- Backfill the trusted password status for existing accounts.
update public.profiles p
set password_set = exists (
  select 1 from auth.users u
  where u.id = p.id
    and u.encrypted_password is not null
    and u.encrypted_password <> ''
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, email, role, status, password_set)
  values (
    new.id,
    new.email,
    'user',
    'active',
    (new.encrypted_password is not null and new.encrypted_password <> '')
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create or replace function public.resolve_auth_identifier(identifier text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  value text := lower(trim(identifier));
  found boolean := false;
  has_pw boolean := false;
begin
  if value = '' then
    return jsonb_build_object('registered', false, 'kind', 'none');
  end if;

  if position('@' in value) > 1 then
    select exists(select 1 from auth.users where lower(email) = value),
           exists(select 1 from auth.users where lower(email) = value and coalesce(encrypted_password, '') <> '')
      into found, has_pw;
    return jsonb_build_object('registered', found, 'kind', 'email', 'has_password', has_pw);
  end if;

  select exists(
           select 1 from auth.users u
           where lower(coalesce(u.raw_user_meta_data->>'username','')) = value
         ),
         exists(
           select 1 from auth.users u
           where lower(coalesce(u.raw_user_meta_data->>'username','')) = value
             and coalesce(u.encrypted_password, '') <> ''
         )
    into found, has_pw;
  return jsonb_build_object('registered', found, 'kind', 'username', 'has_password', has_pw);
end;
$$;

create or replace function public.mark_password_set()
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare ok boolean;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select (encrypted_password is not null and encrypted_password <> '') into ok from auth.users where id = auth.uid();
  update public.profiles set password_set = coalesce(ok,false) where id = auth.uid();
  return coalesce(ok,false);
end;
$$;

create or replace function public.get_my_auth_status()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
stable
as $$
declare p boolean;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select exists(
    select 1 from auth.users u
    where u.id = auth.uid() and coalesce(u.encrypted_password, '') <> ''
  ) into p;
  return jsonb_build_object('password_set', coalesce(p,false));
end;
$$;

revoke all on function public.mark_password_set() from public;
grant execute on function public.mark_password_set() to authenticated;
revoke all on function public.get_my_auth_status() from public;
grant execute on function public.get_my_auth_status() to authenticated;
revoke all on function public.resolve_auth_identifier(text) from public;
grant execute on function public.resolve_auth_identifier(text) to anon, authenticated;

-- Wallet integrity: keep the known transaction types and useful query paths enforced at DB level.
do $$
begin
  alter table public.wallet_transactions drop constraint if exists wallet_transactions_type_check;
  alter table public.wallet_transactions add constraint wallet_transactions_type_check
    check (type in ('salary','income_other','expense','transfer','withdraw','etransit_add','transport','savings_add','savings_use','borrow','repay','lend','lend_repay'));
exception when others then null;
end $$;

alter table public.wallet_recurring add column if not exists updated_at timestamptz not null default now();
create index if not exists wallet_transactions_user_date_type_idx on public.wallet_transactions(user_id, date desc, type);
create index if not exists wallet_recurring_user_type_idx on public.wallet_recurring(user_id, type, active);

create or replace function public.set_recurring_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists wallet_recurring_updated_at on public.wallet_recurring;
create trigger wallet_recurring_updated_at before update on public.wallet_recurring for each row execute function public.set_recurring_updated_at();

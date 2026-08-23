-- Admin dashboard: roles + user management RPCs.
-- Run this once in the Supabase SQL Editor. Safe to re-run (idempotent).
--
-- This replaces whatever am_i_admin() implementation currently exists with
-- a role-based one backed by a new public.profiles table, so all admin
-- checks across the app now go through the same source of truth.

-- 1. Profiles table -----------------------------------------------------
-- One row per auth user. Role lives here instead of on auth.users so it
-- can be safely read from the client under RLS.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'user' check (role in ('user','editor','admin')),
  status text not null default 'active' check (status in ('active','suspended')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

-- 2. Keep profiles in sync with new signups ------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: make sure every existing auth user already has a profile row.
insert into public.profiles (id, email)
select u.id, u.email
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- 3. Role-check helpers ---------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_editor_or_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('editor','admin')
  );
$$;

-- Kept for backward compatibility with existing app code (admin blog page
-- already calls supabase.rpc('am_i_admin')). Now backed by profiles.role.
create or replace function public.am_i_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_admin();
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_editor_or_admin() from public;
revoke all on function public.am_i_admin() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_editor_or_admin() to authenticated;
grant execute on function public.am_i_admin() to authenticated;

-- Admins can see and update every profile (needed for the user list + role
-- changes). Regular users still only see their own row (policy above).
drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin" on public.profiles
  for select using (public.is_admin());

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin());

-- 4. Admin RPCs -------------------------------------------------------------
-- Returns every user for the admin Users page in one call. Admin-only.
create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  role text,
  status text,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
language sql
security definer
set search_path = public, auth
stable
as $$
  select p.id, p.email, p.role, p.status, p.created_at, u.last_sign_in_at
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.is_admin()
  order by p.created_at desc;
$$;

revoke all on function public.admin_list_users() from public;
grant execute on function public.admin_list_users() to authenticated;

-- Change another user's role. Admin-only. An admin cannot demote themself
-- through this function, so there's always at least one admin left.
create or replace function public.admin_set_user_role(target_id uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  if new_role not in ('user','editor','admin') then
    raise exception 'invalid role';
  end if;
  if target_id = auth.uid() and new_role <> 'admin' then
    raise exception 'cannot change your own admin role';
  end if;
  update public.profiles set role = new_role where id = target_id;
end;
$$;

revoke all on function public.admin_set_user_role(uuid, text) from public;
grant execute on function public.admin_set_user_role(uuid, text) to authenticated;

-- Suspend / reinstate a user (app-level status flag — see docs/ADMIN_DASHBOARD.md
-- for how this is enforced, and lib/supabaseAdmin.js for the account-level ban
-- used alongside it). Admin-only, cannot suspend yourself.
create or replace function public.admin_set_user_status(target_id uuid, new_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  if new_status not in ('active','suspended') then
    raise exception 'invalid status';
  end if;
  if target_id = auth.uid() then
    raise exception 'cannot suspend your own account';
  end if;
  update public.profiles set status = new_status where id = target_id;
end;
$$;

revoke all on function public.admin_set_user_status(uuid, text) from public;
grant execute on function public.admin_set_user_status(uuid, text) to authenticated;

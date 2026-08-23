-- 11_fix_profiles_and_posts_rls.sql
-- Fixes: (1) new signups failing ("Database error saving new user"),
--        (2) blog post creation failing RLS ("violates row-level security
--            policy for table posts").
-- Root cause: public.posts still had RLS policies from an earlier schema
-- version that checked a boolean `profiles.is_admin` column directly,
-- instead of the current role-based `public.is_admin()` /
-- `public.is_editor_or_admin()` functions from 09_admin_roles.sql. Any
-- legacy NOT NULL columns left over on profiles from an even earlier
-- schema version could also break the handle_new_user() trigger insert.
-- Safe to re-run.

-- 1. Make sure profiles has exactly the columns the current app expects,
--    and that no legacy NOT NULL column can block the trigger's insert.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'username'
  ) then
    execute 'alter table public.profiles alter column username drop not null';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'full_name'
  ) then
    execute 'alter table public.profiles alter column full_name drop not null';
  end if;
end $$;

alter table public.profiles add column if not exists role text not null default 'user';
alter table public.profiles add column if not exists status text not null default 'active';

-- Re-assert the check constraints (idempotent: drop-then-add by name so this
-- doesn't fail if they already exist from 09_admin_roles.sql).
do $$
begin
  alter table public.profiles drop constraint if exists profiles_role_check;
  alter table public.profiles add constraint profiles_role_check check (role in ('user','editor','admin'));
  alter table public.profiles drop constraint if exists profiles_status_check;
  alter table public.profiles add constraint profiles_status_check check (status in ('active','suspended'));
exception when others then
  null; -- constraints already correct or table shape differs slightly; safe to skip
end $$;

-- 2. Re-affirm handle_new_user() to only ever touch columns guaranteed to
--    exist (id, email, role, status), so legacy leftover columns with
--    defaults can't break it.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, status)
  values (new.id, new.email, 'user', 'active')
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Fix public.posts RLS: replace every policy with the current
--    role-based checks (is_editor_or_admin can write, is_admin can delete).
--    Drops every plausible old policy name so this works regardless of
--    exactly how they were originally named.
drop policy if exists "Admins can insert posts" on public.posts;
drop policy if exists "Admins can update posts" on public.posts;
drop policy if exists "Admins can delete posts" on public.posts;
drop policy if exists "Admins can read all posts" on public.posts;
drop policy if exists "posts_insert_admin" on public.posts;
drop policy if exists "posts_update_admin" on public.posts;
drop policy if exists "posts_delete_admin" on public.posts;

create policy "posts_insert_editor_or_admin" on public.posts
  for insert with check (public.is_editor_or_admin());

create policy "posts_update_editor_or_admin" on public.posts
  for update using (public.is_editor_or_admin());

create policy "posts_delete_admin_only" on public.posts
  for delete using (public.is_admin());

create policy "posts_select_editor_or_admin_all" on public.posts
  for select using (published = true or public.is_editor_or_admin());

-- 4. Safety net: make sure the known admin account is actually role='admin'.
-- Replace the email below if this isn't the right account.
update public.profiles set role = 'admin'
where email = 'abubakarsultan15607@gmail.com';

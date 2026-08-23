-- 14_p0_security_hardening.sql
-- P0 production hardening. Safe to re-run.
--
-- This migration does not replace the existing ownership policies. It makes
-- the intended security boundary explicit and removes unnecessary grants.

-- 1. Explicitly enable RLS on every private application table that the
-- current app can use. If a legacy table exists but is no longer used,
-- enabling RLS is safer than leaving it exposed.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'wallet_transactions',
    'wallet_categories',
    'wallet_bills',
    'wallet_budgets',
    'wallet_goals',
    'wallet_recurring',
    'wallet_data',
    'profiles',
    'posts',
    'site_settings',
    'admin_audit_log',
    'contact_messages'
  ] loop
    if to_regclass('public.' || table_name) is not null then
      execute format('alter table public.%I enable row level security', table_name);
    end if;
  end loop;
end $$;

-- 2. Keep contact submission public, but do not grant anonymous clients the
-- ability to read or update messages. The API route uses the service role.
revoke select, update, delete on public.contact_messages from anon;
revoke select, update, delete on public.contact_messages from authenticated;
grant insert on public.contact_messages to anon, authenticated;
grant select, update on public.contact_messages to authenticated;

-- 3. Audit logs are read-only for authenticated admins. Inserts are made by
-- the server-side service-role client in the admin API routes.
revoke all on public.admin_audit_log from anon;
revoke insert, update, delete on public.admin_audit_log from authenticated;
grant select on public.admin_audit_log to authenticated;

-- 4. Service-role-only tables must not accidentally become writable through
-- the browser. RLS policies already provide the row-level boundary; these
-- grants make the table privileges explicit as well.
revoke all on public.admin_audit_log from anon;

-- 5. Remove direct anonymous execution from all known admin RPCs. The app
-- uses authenticated sessions and the functions themselves perform an
-- additional is_admin()/is_editor_or_admin() authorization check.
do $$
begin
  if to_regprocedure('public.is_admin()') is not null then
    revoke all on function public.is_admin() from anon;
    grant execute on function public.is_admin() to authenticated;
  end if;
  if to_regprocedure('public.is_editor_or_admin()') is not null then
    revoke all on function public.is_editor_or_admin() from anon;
    grant execute on function public.is_editor_or_admin() to authenticated;
  end if;
  if to_regprocedure('public.am_i_admin()') is not null then
    revoke all on function public.am_i_admin() from anon;
    grant execute on function public.am_i_admin() to authenticated;
  end if;
  if to_regprocedure('public.admin_list_users()') is not null then
    revoke all on function public.admin_list_users() from anon;
    grant execute on function public.admin_list_users() to authenticated;
  end if;
end $$;

-- 6. Keep the singleton SEO settings readable publicly but writable only by
-- admins through the existing RLS policy.
drop policy if exists "site_settings_update_admin" on public.site_settings;
create policy "site_settings_update_admin" on public.site_settings
  for update using (public.is_admin()) with check (public.is_admin());

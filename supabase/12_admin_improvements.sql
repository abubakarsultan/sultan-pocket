-- 12_admin_improvements.sql
-- Adds: dashboard stats RPC, admin activity audit log, contact messages
-- storage. Safe to re-run.

-- 1. Dashboard stats -------------------------------------------------------
create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_editor_or_admin() then
    raise exception 'not authorized';
  end if;

  select jsonb_build_object(
    'total_users', (select count(*) from public.profiles),
    'new_users_this_week', (select count(*) from public.profiles where created_at >= now() - interval '7 days'),
    'active_users', (select count(*) from public.profiles where status = 'active'),
    'suspended_users', (select count(*) from public.profiles where status = 'suspended'),
    'published_posts', (select count(*) from public.posts where published = true),
    'draft_posts', (select count(*) from public.posts where published = false),
    'total_transactions', (select count(*) from public.wallet_transactions),
    'unread_messages', (select count(*) from public.contact_messages where status = 'unread')
  ) into result;

  return result;
end;
$$;

revoke all on function public.admin_dashboard_stats() from public;
grant execute on function public.admin_dashboard_stats() to authenticated;

-- 2. Admin activity audit log ----------------------------------------------
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  action text not null,
  target_user_id uuid,
  target_email text,
  details jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_log enable row level security;

drop policy if exists "audit_log_select_admin" on public.admin_audit_log;
create policy "audit_log_select_admin" on public.admin_audit_log
  for select using (public.is_admin());

-- No insert/update/delete policies for regular clients — only the service
-- role (used server-side in the API routes) can write to this table.

-- 3. Contact messages --------------------------------------------------------
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'unread' check (status in ('unread','read','replied')),
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

-- Anyone (even signed-out visitors) can submit a contact message.
drop policy if exists "contact_messages_insert_anyone" on public.contact_messages;
create policy "contact_messages_insert_anyone" on public.contact_messages
  for insert with check (true);

-- Only editors/admins can read or update messages.
drop policy if exists "contact_messages_select_staff" on public.contact_messages;
create policy "contact_messages_select_staff" on public.contact_messages
  for select using (public.is_editor_or_admin());

drop policy if exists "contact_messages_update_staff" on public.contact_messages;
create policy "contact_messages_update_staff" on public.contact_messages
  for update using (public.is_editor_or_admin());

grant select, insert, update on public.contact_messages to authenticated, anon;
grant usage on schema public to anon;

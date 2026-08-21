-- Auth helpers for the unified sign-in/sign-up flow.
-- These signatures intentionally match the frontend RPC calls:
--   is_username_taken({ uname }) -> boolean
--   get_email_for_username({ uname }) -> text

create or replace function public.is_username_taken(uname text)
returns boolean
language sql
security definer
set search_path = public, auth
stable
as $$
  select exists (
    select 1
    from auth.users
    where lower(coalesce(raw_user_meta_data->>'username', '')) = lower(trim(uname))
  );
$$;

revoke all on function public.is_username_taken(text) from public;
grant execute on function public.is_username_taken(text) to anon, authenticated;

create or replace function public.get_email_for_username(uname text)
returns text
language sql
security definer
set search_path = public, auth
stable
as $$
  select email
  from auth.users
  where lower(coalesce(raw_user_meta_data->>'username', '')) = lower(trim(uname))
  limit 1;
$$;

revoke all on function public.get_email_for_username(text) from public;
grant execute on function public.get_email_for_username(text) to anon, authenticated;

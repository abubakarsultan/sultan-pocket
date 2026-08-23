-- 15_auth_password_state.sql
-- Fixes the password-state check used by the unified sign-in flow.
--
-- A user who has successfully set a password (including an account that
-- originally came from Google or an admin invitation) must be treated as a
-- normal email/password account on the next sign-in. The source of truth is
-- auth.users.encrypted_password, not client metadata.
-- Safe to re-run.

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
    return jsonb_build_object('registered', false, 'kind', 'none', 'has_password', false);
  end if;

  if position('@' in value) > 1 then
    select
      exists (
        select 1
        from auth.users u
        where lower(u.email) = value
      ),
      exists (
        select 1
        from auth.users u
        where lower(u.email) = value
          and nullif(u.encrypted_password, '') is not null
      )
    into found, has_pw;

    return jsonb_build_object(
      'registered', found,
      'kind', 'email',
      'has_password', has_pw
    );
  end if;

  select
    exists (
      select 1
      from auth.users u
      where lower(coalesce(u.raw_user_meta_data->>'username', '')) = value
    ),
    exists (
      select 1
      from auth.users u
      where lower(coalesce(u.raw_user_meta_data->>'username', '')) = value
        and nullif(u.encrypted_password, '') is not null
    )
  into found, has_pw;

  return jsonb_build_object(
    'registered', found,
    'kind', 'username',
    'has_password', has_pw
  );
end;
$$;

revoke all on function public.resolve_auth_identifier(text) from public;
grant execute on function public.resolve_auth_identifier(text) to anon, authenticated;

-- 13_signin_password_check.sql
-- Adds has_password to resolve_auth_identifier() so the sign-in page can
-- tell the difference between "wrong password" and "this account never had
-- a password set" (Google-only accounts, or an invite that hasn't been
-- completed yet). Safe to re-run. Same function as in 07_auth_identifier.sql,
-- provided here separately so it can be applied on its own.

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
           coalesce(bool_or(u.encrypted_password is not null and u.encrypted_password <> ''), false)
      into found, has_pw
      from auth.users u where lower(u.email) = value;

    return jsonb_build_object(
      'registered', found,
      'kind', 'email',
      'has_password', has_pw
    );
  end if;

  select exists(select 1 from auth.users where lower(coalesce(raw_user_meta_data->>'username', '')) = value),
         coalesce(bool_or(u.encrypted_password is not null and u.encrypted_password <> ''), false)
    into found, has_pw
    from auth.users u where lower(coalesce(u.raw_user_meta_data->>'username', '')) = value;

  return jsonb_build_object(
    'registered', found,
    'kind', 'username',
    'has_password', has_pw
  );
end;
$$;

revoke all on function public.resolve_auth_identifier(text) from public;
grant execute on function public.resolve_auth_identifier(text) to anon, authenticated;

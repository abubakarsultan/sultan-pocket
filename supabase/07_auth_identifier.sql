-- Auth identifier lookup for the unified sign-in/sign-up flow.
-- This intentionally returns only whether an identifier is registered and its kind;
-- it does not expose another user's email address.

create or replace function public.resolve_auth_identifier(identifier text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  value text := lower(trim(identifier));
  found boolean := false;
begin
  if value = '' then
    return jsonb_build_object('registered', false, 'kind', 'none');
  end if;

  if position('@' in value) > 1 then
    select exists(
      select 1 from auth.users
      where lower(email) = value
    ) into found;

    return jsonb_build_object(
      'registered', found,
      'kind', 'email'
    );
  end if;

  select exists(
    select 1 from auth.users
    where lower(coalesce(raw_user_meta_data->>'username', '')) = value
  ) into found;

  return jsonb_build_object(
    'registered', found,
    'kind', 'username'
  );
end;
$$;

revoke all on function public.resolve_auth_identifier(text) from public;
grant execute on function public.resolve_auth_identifier(text) to anon, authenticated;

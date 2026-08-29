-- 17_newsletter_signups.sql
-- Public newsletter subscription table. Anyone may insert; only admins may read.
create table if not exists public.newsletter_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.newsletter_signups enable row level security;

drop policy if exists "newsletter_insert_public" on public.newsletter_signups;
create policy "newsletter_insert_public" on public.newsletter_signups
  for insert to anon, authenticated
  with check (length(trim(email)) > 3);

drop policy if exists "newsletter_select_admin" on public.newsletter_signups;
create policy "newsletter_select_admin" on public.newsletter_signups
  for select to authenticated
  using (public.is_admin());

revoke all on public.newsletter_signups from public;
grant insert on public.newsletter_signups to anon, authenticated;
grant select on public.newsletter_signups to authenticated;

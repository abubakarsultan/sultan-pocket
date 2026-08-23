-- SEO controls: per-post SEO fields on the blog, plus a single site-wide
-- settings row the admin SEO page reads and writes.
-- Safe to re-run.

-- 1. Per-post SEO fields on the existing posts table -----------------------
alter table public.posts add column if not exists meta_title text;
alter table public.posts add column if not exists meta_description text;

-- 2. Site-wide SEO settings -------------------------------------------------
create table if not exists public.site_settings (
  id int primary key default 1,
  site_title text not null default 'Sultan Pocket',
  site_description text not null default 'Track your money across every part of your life.',
  og_image_url text,
  updated_at timestamptz not null default now(),
  constraint site_settings_singleton check (id = 1)
);

insert into public.site_settings (id) values (1)
on conflict (id) do nothing;

alter table public.site_settings enable row level security;

-- Anyone can read site settings (used to render <meta> tags on every page).
drop policy if exists "site_settings_select_all" on public.site_settings;
create policy "site_settings_select_all" on public.site_settings
  for select using (true);

-- Only admins can change them.
drop policy if exists "site_settings_update_admin" on public.site_settings;
create policy "site_settings_update_admin" on public.site_settings
  for update using (public.is_admin());

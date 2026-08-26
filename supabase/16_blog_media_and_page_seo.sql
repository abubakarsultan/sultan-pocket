-- Sultan Pocket: blog media + per-page SEO controls.
-- Run once in Supabase SQL Editor. Safe to re-run.

-- 1. Public media bucket for blog cover/content images.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('blog-media', 'blog-media', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Public can read blog images because published posts render them directly.
drop policy if exists "blog_media_public_read" on storage.objects;
create policy "blog_media_public_read" on storage.objects
  for select using (bucket_id = 'blog-media');

-- Only editors/admins can upload or modify blog media.
drop policy if exists "blog_media_editor_insert" on storage.objects;
create policy "blog_media_editor_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'blog-media' and public.is_editor_or_admin());

drop policy if exists "blog_media_editor_update" on storage.objects;
create policy "blog_media_editor_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'blog-media' and public.is_editor_or_admin())
  with check (bucket_id = 'blog-media' and public.is_editor_or_admin());

drop policy if exists "blog_media_editor_delete" on storage.objects;
create policy "blog_media_editor_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'blog-media' and public.is_editor_or_admin());

-- Optional footer social links, managed from Admin → SEO.
alter table public.site_settings add column if not exists instagram_url text;
alter table public.site_settings add column if not exists facebook_url text;
alter table public.site_settings add column if not exists x_url text;
alter table public.site_settings add column if not exists linkedin_url text;

-- 2. Per-public-page SEO settings.
create table if not exists public.page_seo (
  path text primary key,
  title text,
  description text,
  canonical_url text,
  og_title text,
  og_description text,
  og_image_url text,
  twitter_title text,
  twitter_description text,
  twitter_image_url text,
  keywords text,
  robots_index boolean not null default true,
  robots_follow boolean not null default true,
  include_in_sitemap boolean not null default true,
  priority numeric(2,1) not null default 0.7,
  change_frequency text not null default 'weekly',
  updated_at timestamptz not null default now()
);

alter table public.page_seo enable row level security;

drop policy if exists "page_seo_select_public" on public.page_seo;
create policy "page_seo_select_public" on public.page_seo
  for select using (true);

drop policy if exists "page_seo_insert_admin" on public.page_seo;
create policy "page_seo_insert_admin" on public.page_seo
  for insert to authenticated with check (public.is_admin());

drop policy if exists "page_seo_update_admin" on public.page_seo;
create policy "page_seo_update_admin" on public.page_seo
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "page_seo_delete_admin" on public.page_seo;
create policy "page_seo_delete_admin" on public.page_seo
  for delete to authenticated using (public.is_admin());

insert into public.page_seo (path, title, description, canonical_url, og_title, og_description, robots_index, robots_follow, include_in_sitemap, priority, change_frequency)
values
  ('/', 'Sultan Pocket — Manage your money, your way.', 'Sultan Pocket helps you track expenses, plan budgets, and grow savings — all your personal finance tools in one place.', 'https://sultanpocket.online/', 'Sultan Pocket — Manage your money, your way.', 'Personal finance, made simple.', true, true, true, 1.0, 'weekly'),
  ('/services', 'Features & Services — Sultan Pocket', 'Explore Sultan Pocket tools for expenses, income, savings, transfers, borrowing, and personal money management.', 'https://sultanpocket.online/services', 'Features & Services — Sultan Pocket', 'Explore Sultan Pocket tools for everyday money management.', true, true, true, 0.9, 'monthly'),
  ('/about', 'About — Sultan Pocket', 'Learn what Sultan Pocket is and why it was built.', 'https://sultanpocket.online/about', 'About — Sultan Pocket', 'Learn what Sultan Pocket is and why it was built.', true, true, true, 0.6, 'monthly'),
  ('/blog', 'Blog — Sultan Pocket', 'Practical personal finance guides, budgeting tips, savings ideas and Sultan Pocket updates.', 'https://sultanpocket.online/blog', 'Blog — Sultan Pocket', 'Practical personal finance guides and product updates.', true, true, true, 0.9, 'daily'),
  ('/faq', 'FAQ — Sultan Pocket', 'Frequently asked questions about Sultan Pocket.', 'https://sultanpocket.online/faq', 'FAQ — Sultan Pocket', 'Answers about Sultan Pocket accounts, wallets, and features.', true, true, true, 0.5, 'monthly'),
  ('/contact', 'Contact — Sultan Pocket', 'Contact Sultan Pocket for product questions, feedback, bug reports, or feature ideas.', 'https://sultanpocket.online/contact', 'Contact — Sultan Pocket', 'Questions, feedback, bugs, or ideas? Get in touch.', true, true, true, 0.5, 'monthly'),
  ('/privacy', 'Privacy Policy — Sultan Pocket', 'Privacy Policy for Sultan Pocket.', 'https://sultanpocket.online/privacy', 'Privacy Policy — Sultan Pocket', 'How Sultan Pocket handles account and wallet information.', true, true, true, 0.3, 'yearly'),
  ('/terms', 'Terms of Service — Sultan Pocket', 'Terms of Service for Sultan Pocket.', 'https://sultanpocket.online/terms', 'Terms of Service — Sultan Pocket', 'Terms governing use of Sultan Pocket.', true, true, true, 0.3, 'yearly')
on conflict (path) do nothing;

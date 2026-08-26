-- 14_blog_categories.sql
-- Adds a category to each blog post, used for the featured-post + category
-- tabs blog page redesign. Safe to re-run.

alter table public.posts add column if not exists category text not null default 'General';

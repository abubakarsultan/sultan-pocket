# Admin dashboard — setup

## 1. Run the SQL migrations

In the Supabase SQL Editor, run these two new files once, in order:

1. `supabase/09_admin_roles.sql` — creates `profiles` (role + status per
   user), the `is_admin()` / `is_editor_or_admin()` / `am_i_admin()` helper
   functions, and the admin RPCs used by the Users page.
2. `supabase/10_seo.sql` — adds `meta_title` / `meta_description` to
   `posts`, and creates `site_settings` (site-wide SEO fields).

Both are safe to re-run if needed.

## 2. Add the service role key

Admin actions that touch Supabase Auth directly — inviting a user,
suspending/reinstating, deleting an account — run through
`app/api/admin/*` route handlers using the **service role key**, because
those actions aren't possible with the public anon key. Add it to
`.env.local` (and to your Vercel project's environment variables):

```
SUPABASE_SERVICE_ROLE_KEY=...
```

Find it in the Supabase dashboard under Settings → API → service_role key.
**Never** prefix it with `NEXT_PUBLIC_` — it must never reach the browser.

## 3. Make yourself the first admin

Every new signup starts out with `role = 'user'` in `profiles`. Since the
admin-changing RPCs require you to already be an admin, the very first
admin has to be set directly in the database, once:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

Run that in the Supabase SQL Editor after you've signed up normally on the
site. After that, you can manage every other user's role from
`/dashboard/admin/users` — no more raw SQL needed.

## What's where

- `/dashboard/admin` — overview (visible to editors and admins)
- `/dashboard/admin/users` — invite, change roles, suspend/reinstate, delete (admin-only)
- `/dashboard/admin/blog` — the existing blog editor, now with per-post SEO fields (editors and admins)
- `/dashboard/admin/seo` — site-wide title/description/social image (admin-only)

## Notes on "suspend"

Suspending a user does two things at once: it bans their Supabase Auth
account (so they can't sign in at all) and marks their `profiles.status`
as `suspended` (so the rest of the app can check it if needed). Reinstating
reverses both.

## Not done yet

- The root site metadata (`app/layout.js`) is still static — it doesn't yet
  read from `site_settings`. Wiring that up means converting the static
  `export const metadata` to an async `generateMetadata()`. Worth doing as
  a follow-up once you're using the SEO settings page for real.
- `sitemap.xml` is still the static file in `public/`. A dynamic
  `app/sitemap.js` that pulls in published blog posts automatically is a
  natural next step so it never goes stale.

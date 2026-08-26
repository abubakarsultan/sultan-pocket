## Current restored build — auth, lending, reports and blog hardening

- Added dedicated Settings & Security page with password creation/change and global sign-out.
- Google/invite accounts can create an email password; trusted password status is stored in profiles.
- Invite links use an explicit invite flow and route to password creation.
- Added lending: Lend Money + Receive Repayment, person-wise receivables and over-recovery protection.
- Added Reports & Analytics with six-month trends, category breakdowns, debt and receivables.
- Sanitized public blog HTML and improved article SEO/structured data.

# Sultan Pocket — Project History

Consolidated from the individual phase/setup notes that used to live in this
folder as separate files. Newest first.

## Admin dashboard

- Role-based access control: `profiles` table with `role` (user/editor/admin) and `status` (active/suspended), backed by RLS and security-definer helper functions (`is_admin()`, `is_editor_or_admin()`)
- New `/dashboard/admin` section: overview, Users, Blog, SEO — gated by role, with its own sidebar shell
- Users page: invite by email (Supabase invite flow), change role, suspend/reinstate (bans the Auth account too, not just a flag), delete account
- Server-only admin API routes (`app/api/admin/*`) using the Supabase service role key, each independently re-checking the caller is an admin
- Blog editor extended with per-post SEO title/description, now used on the public post page's metadata
- New SEO settings page backed by a `site_settings` table (site-wide title/description/social image) — not yet wired into the root layout's metadata, see `docs/ADMIN_DASHBOARD.md`
- See `docs/ADMIN_DASHBOARD.md` for the one-time setup steps (run the new SQL files, add the service role key, bootstrap the first admin)

## Wallet — final pass

Consolidated Wallet implementation, now living under `/dashboard/expense-tracker`:

- Multi-page Wallet with dashboard quick actions for all 10 money operations
- Income categories separated from expense categories; user-defined custom categories
- Transaction search, filters, edit, and delete with confirmation
- Filtered CSV export
- Cash / online / savings / E-Transit balances, cash ↔ online transfer, online → cash withdrawal
- Savings add/use, E-Transit top-up and transport spending
- Borrow/repay with person-wise debt tracking
- Previous-month carry-forward / opening balance
- Dashboard income/expense breakdowns and six-month charts (income/expense, transport, savings)
- Guest browsing with demo data, and write-action gating for guests
- Private `/u/[username]` profile page (avatar, personal details, wallet preferences, security)
- Responsive layout throughout

Required env vars on Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Phase 3

- Recurring transaction rules + "upcoming this month" confirmation widget
- Monthly closing summary helper/card
- CSV import with preview, validation, and bulk insert
- Merchant field + transaction search support
- Mobile Wallet bottom navigation, transaction cards, floating action button
- Full account JSON export from the profile page
- Supabase: `06_wallet_phase3.sql` adds `wallet_transactions.merchant`, `public.wallet_recurring`, RLS for recurring rules, and a lookup index

## Phase 2

- "Meet the Creator" section added to `/about` (Abubakar Sultan, Founder & Creator)
- Subtle "Created by Abubakar Sultan" credit added to the global footer
- No Wallet/Auth/Supabase logic changed in this phase

## P0 + P1 — stability, security, account UX

- Wallet moved off the old JSONB `wallet_data` table onto `wallet_transactions` / `wallet_categories`
- `.gitignore` added to exclude `.env.local`, `.next`, `node_modules`, `.vercel`, logs, and other generated files
- `/forgot-password` and `/reset-password` routes added (Supabase Auth callback needs to allow both the production and local URLs)
- Account deletion via Profile → Account actions, calling the `delete_my_account()` Supabase RPC
- Dark mode: Profile menu → Appearance → System / Light / Dark, stored locally
- Fixed: adding a transaction from a non-current Wallet month now defaults to the first day of that month instead of today
- Conflict detection: transaction edits/deletes check the last `updated_at` value and reject (with a reload prompt) if another device changed the row first
- Test suite covers income, expenses, transfers, withdrawals, savings, E-Transit, debt, monthly opening/closing balances, and date helpers — run with `npm test`

## Phase 1 — public website polish

- Expanded homepage: hero, wallet preview, feature cards, how-it-works, benefits, FAQ preview, final CTA
- Added public `/about`, rebuilt `/services`, `/contact`, and added `/faq`
- Updated navbar/footer with Features, About, FAQ, Contact
- Updated sitemap for the new public pages
- Responsive styling for the new public sections

Note: the contact form was a front-end demo at this stage — see `app/api/contact/` for the current backend wiring.

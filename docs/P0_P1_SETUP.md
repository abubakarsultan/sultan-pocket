# Sultan Pocket — P0 + P1 setup

This build includes the P0 stability/security work and P1 account UX work.

## 1. Supabase schema (required)
Run `supabase_schema.sql` in the Supabase SQL Editor.

The Wallet now uses:
- `public.wallet_transactions` — one row per transaction
- `public.wallet_categories` — one row per custom category

The old `wallet_data` JSONB table is no longer read by the app. If its contents are only test data, it can be cleared after the new schema is verified.

## 2. Environment variables
Keep real values only in `.env.local` / Vercel environment variables.
`.env.local.example` intentionally contains placeholders only.

## 3. Git safety
`.gitignore` now excludes `.env.local`, `.next`, `node_modules`, `.vercel`, logs and other generated files.

## 4. Authentication
New routes:
- `/forgot-password`
- `/reset-password`

In Supabase Auth URL Configuration, allow the production callback:
`https://sultanpocket.online/reset-password`

Also allow the local callback you use during development, for example:
`http://localhost:3000/reset-password`

## 5. Account deletion
Profile → Account actions → Delete account calls the `delete_my_account()` RPC created by `supabase_schema.sql`.

## 6. Dark mode
Profile menu → Appearance → System / Light / Dark.
The preference is stored locally and applied across the site.

## 7. Date bug
When adding a transaction from a non-current Wallet month, the default date is the first day of the selected month instead of today. The current month still defaults to today. Users can always change the date manually.

## 8. Conflict detection
Transaction edits/deletes include the last `updated_at` value. If another device changes the row first, the operation is rejected with a reload message instead of silently overwriting the other change.

## 9. Tests
Run:
`npm test`

The current calculation test suite covers income, expenses, transfers, withdrawals, savings, E-Transit, debt, monthly opening/closing balances and date helpers.

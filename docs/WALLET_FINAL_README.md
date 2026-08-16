# Sultan Pocket — Wallet Final Pass

This package is the consolidated Wallet implementation.

## Included

- Multi-page Next.js Wallet under `/dashboard/wallet`
- Dashboard quick actions for all 10 money operations
- Income categories separated from Expense categories
- `Monthly Salary` replaces `Monthly Stipend`
- User custom Income/Expense categories
- Transaction search and filters
- Edit transaction
- Delete with confirmation
- Filtered CSV export
- Accurate cash/online/savings/E-Transit calculations
- Cash ↔ Online transfer
- Online → Cash withdrawal
- Savings add/use
- E-Transit top-up and transport spending
- Borrow/repay with person-wise debt
- Previous-month carry-forward/opening balance
- Dashboard income/expense breakdowns
- Six-month income/expense, transport and savings charts
- Balance distribution
- Guest browsing with demo data
- Guest write-action gating
- Private `/u/[username]` profile
- Profile avatar, personal details, wallet preferences, security
- Sign out inside the profile menu
- Responsive Wallet layout
- Supabase RLS setup SQL
- Optional Wallet-only test-data reset SQL

## Supabase

Run `supabase_wallet_setup.sql` once if the `wallet_data` table/RLS policies are not already configured.

If you intentionally want to clear Wallet test data only, run `supabase_wallet_reset.sql`.

Do not delete Supabase Auth users to reset Wallet test data.

## Environment variables

Vercel needs:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Deployment

Push the project to the connected GitHub `main` branch. Vercel should build it with `npm run build`.

After deployment, test:
1. Guest Wallet browsing.
2. Sign in.
3. Add income.
4. Add expense.
5. Transfer.
6. Withdraw.
7. Savings.
8. E-Transit.
9. Borrow/repay.
10. Edit/delete + confirmation.
11. Export CSV.
12. Profile menu/profile edit.

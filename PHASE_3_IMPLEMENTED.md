# Sultan Pocket — Phase 3 implementation

Implemented in this project:

1. Recurring transaction rules + Upcoming-this-month confirmation widget.
2. Monthly closing summary helper/card.
3. CSV import with preview, validation, and bulk insert.
4. Merchant field + transaction search support.
5. Mobile Wallet bottom navigation, transaction cards, FAB, and responsive polish.
6. Full account JSON export from the profile page.

## Supabase SQL

Run `supabase_wallet_phase3.sql` in the Supabase SQL Editor. It adds:

- `wallet_transactions.merchant`
- `public.wallet_recurring`
- RLS for recurring rules
- an index for recurring lookups

Phase 2 attachment storage remains in `supabase_wallet_attachments.sql`.

## Verification

- `node --experimental-default-type=module --test lib/wallet/calc.test.js` — **10/10 passing**
- `npm run build` could not be executed in this environment because the project dependencies are not installed and the environment could not fetch the missing npm packages. No source changes were made to work around that limitation.

Before deployment, run:

```bash
npm ci
npm run test
npm run build
```

Then run `supabase_wallet_phase3.sql` against the production Supabase project.

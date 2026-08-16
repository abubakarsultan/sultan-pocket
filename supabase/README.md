# Supabase SQL files

Run the numbered files in order, once, in the Supabase SQL Editor:

1. `01_schema.sql` — core production schema (wallet_transactions, wallet_categories, etc.)
2. `02_storage_avatars.sql` — creates the `avatars` storage bucket + policies
3. `03_wallet_attachments.sql` — Phase 2: receipt/bill image attachments
4. `04_wallet_bills.sql` — bill & subscription reminders table
5. `05_wallet_budget_goals.sql` — budget limits + savings goals tables
6. `06_wallet_phase3.sql` — Phase 3: recurring transactions, merchant search, data export

## dev-tools/
Scripts you run manually, only when you want to (never automatically):
- `reset_wallet_test_data.sql` — deletes all Wallet records for testing. Does NOT touch auth users or profiles.

## archive/
Old files kept for reference only — not part of the current setup:
- `deprecated_wallet_setup.sql` — superseded by `01_schema.sql`
- `legacy_data_migration_notes.sql` — notes on the old JSONB `wallet_data` table, which the current app no longer reads

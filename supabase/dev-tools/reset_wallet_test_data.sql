-- Optional Wallet test-data reset.
-- This deletes Wallet records only. It does not delete Auth users or profile metadata.
delete from public.wallet_data;

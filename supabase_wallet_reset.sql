-- Sultan Pocket: clean reset for the NEW wallet implementation.
-- Run this only in the Supabase SQL editor for your testing project.
-- It removes all existing test wallet records; authentication users are NOT deleted.
DELETE FROM public.wallet_data;

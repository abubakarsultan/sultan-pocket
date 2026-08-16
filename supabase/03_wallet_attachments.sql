-- Sultan Pocket Wallet Attachments
-- Phase 2: private receipt/bill image storage
--
-- Dashboard setup:
-- 1. Supabase Dashboard -> Storage -> New Bucket
-- 2. Name: wallet-attachments
-- 3. Keep "Public bucket" OFF.
-- 4. Then run the SQL below in the Supabase SQL Editor.

alter table public.wallet_transactions
  add column if not exists attachment_path text;

-- Storage objects are protected by the user's auth.uid() and the first
-- folder segment of the object path. The app stores files as:
-- {user_id}/{transaction_id}-{timestamp}.{ext}

drop policy if exists "Users can upload their own wallet attachments" on storage.objects;
create policy "Users can upload their own wallet attachments"
on storage.objects
for insert
with check (
  bucket_id = 'wallet-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can view their own wallet attachments" on storage.objects;
create policy "Users can view their own wallet attachments"
on storage.objects
for select
using (
  bucket_id = 'wallet-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete their own wallet attachments" on storage.objects;
create policy "Users can delete their own wallet attachments"
on storage.objects
for delete
using (
  bucket_id = 'wallet-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

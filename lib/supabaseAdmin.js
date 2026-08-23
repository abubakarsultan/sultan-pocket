import { createClient } from '@supabase/supabase-js';

// Server-only client using the service role key. NEVER import this from a
// 'use client' component or send this key to the browser — it bypasses RLS
// entirely. Only used inside app/api/admin/* route handlers, which run on
// the server and check the caller is an admin before doing anything.
let cached = null;

export function supabaseAdmin() {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
      'Add SUPABASE_SERVICE_ROLE_KEY to .env.local (Supabase dashboard → Settings → API → service_role key). ' +
      'Never expose this key with a NEXT_PUBLIC_ prefix.'
    );
  }

  cached = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}

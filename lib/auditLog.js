import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Writes one row to public.admin_audit_log using the service role client
// (bypasses RLS by design — this table has no client-facing insert policy).
// Never throws: a logging failure should never block the underlying admin
// action from completing.
export async function logAdminAction({ actor, action, targetUserId, targetEmail, details }) {
  try {
    const admin = supabaseAdmin();
    await admin.from('admin_audit_log').insert({
      actor_id: actor?.id || null,
      actor_email: actor?.email || null,
      action,
      target_user_id: targetUserId || null,
      target_email: targetEmail || null,
      details: details || null,
    });
  } catch (e) {
    console.error('Failed to write admin audit log entry:', e);
  }
}

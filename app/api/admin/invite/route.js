import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/requireAdmin';
import { logAdminAction } from '@/lib/auditLog';

export async function POST(request) {
  const check = await requireAdmin(request);
  if (check.error) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const { email, role } = await request.json().catch(() => ({}));
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }
  const finalRole = ['user', 'editor', 'admin'].includes(role) ? role : 'user';

  const admin = supabaseAdmin();

  // Sends the user a Supabase invite email; they set their own password by
  // following the link. Their profiles row is created automatically by the
  // on_auth_user_created trigger (see 09_admin_roles.sql).
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email.trim().toLowerCase());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // If a non-default role was chosen, apply it now (the trigger only ever
  // creates 'user' rows).
  if (finalRole !== 'user' && data?.user?.id) {
    await admin.from('profiles').update({ role: finalRole }).eq('id', data.user.id);
  }

  await logAdminAction({
    actor: check.user,
    action: 'invite_user',
    targetUserId: data?.user?.id,
    targetEmail: email.trim().toLowerCase(),
    details: { role: finalRole },
  });

  return NextResponse.json({ ok: true, userId: data?.user?.id });
}

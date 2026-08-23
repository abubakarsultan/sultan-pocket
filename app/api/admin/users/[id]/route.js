import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/requireAdmin';
import { logAdminAction } from '@/lib/auditLog';

// A very long ban duration stands in for "suspended indefinitely" — Supabase
// doesn't have a permanent-ban flag, but this blocks sign-in for ~100 years.
const SUSPEND_DURATION = '876000h';

export async function PATCH(request, { params }) {
  const check = await requireAdmin(request);
  if (check.error) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const targetId = params.id;
  if (targetId === check.user.id) {
    return NextResponse.json({ error: 'You cannot change your own role or status' }, { status: 400 });
  }

  const { role, status } = await request.json().catch(() => ({}));
  const admin = supabaseAdmin();

  const { data: targetProfile } = await admin.from('profiles').select('email').eq('id', targetId).maybeSingle();
  const targetEmail = targetProfile?.email || null;

  if (role) {
    if (!['user', 'editor', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    const { error } = await admin.from('profiles').update({ role }).eq('id', targetId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await logAdminAction({ actor: check.user, action: 'change_role', targetUserId: targetId, targetEmail, details: { new_role: role } });
  }

  if (status) {
    if (!['active', 'suspended'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    // Block/unblock sign-in at the auth level, not just a flag in our own table.
    const { error: banErr } = await admin.auth.admin.updateUserById(targetId, {
      ban_duration: status === 'suspended' ? SUSPEND_DURATION : 'none',
    });
    if (banErr) return NextResponse.json({ error: banErr.message }, { status: 400 });

    const { error } = await admin.from('profiles').update({ status }).eq('id', targetId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await logAdminAction({ actor: check.user, action: status === 'suspended' ? 'suspend_user' : 'reinstate_user', targetUserId: targetId, targetEmail });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const check = await requireAdmin(request);
  if (check.error) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const targetId = params.id;
  if (targetId === check.user.id) {
    return NextResponse.json({ error: 'You cannot delete your own account here' }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { data: targetProfile } = await admin.from('profiles').select('email').eq('id', targetId).maybeSingle();
  const targetEmail = targetProfile?.email || null;

  // Deletes the auth user; the profiles row goes with it via "on delete cascade".
  const { error } = await admin.auth.admin.deleteUser(targetId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logAdminAction({ actor: check.user, action: 'delete_user', targetUserId: targetId, targetEmail });

  return NextResponse.json({ ok: true });
}

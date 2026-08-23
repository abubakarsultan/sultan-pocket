import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Verifies the bearer token sent from the client belongs to a signed-in
// admin. Every route under app/api/admin/* must call this first and stop
// on failure — these routes use the service role key, which bypasses RLS,
// so this check is the only thing standing between "any visitor" and
// "can invite/suspend/delete users".
export async function requireAdmin(request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    return { error: 'Not signed in', status: 401 };
  }

  const admin = supabaseAdmin();
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) {
    return { error: 'Not signed in', status: 401 };
  }

  const { data: profile, error: profileErr } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profileErr || profile?.role !== 'admin') {
    return { error: 'Admin access required', status: 403 };
  }

  return { user: userData.user };
}

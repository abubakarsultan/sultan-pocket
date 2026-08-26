import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

function getBearer(request) {
  const value = request.headers.get('authorization') || '';
  return value.toLowerCase().startsWith('bearer ') ? value.slice(7).trim() : '';
}

export async function POST(request) {
  const token = getBearer(request);
  if (!token) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data: { user }, error: userError } = await client.auth.getUser(token);
  if (userError || !user) return NextResponse.json({ error: 'Your session is invalid. Please sign in again.' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const password = typeof body.password === 'string' ? body.password : '';
  if (password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });

  const admin = supabaseAdmin();
  const { error: updateError } = await admin.auth.admin.updateUserById(user.id, { password });
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  const { error: profileError } = await admin
    .from('profiles')
    .update({ password_set: true })
    .eq('id', user.id);
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

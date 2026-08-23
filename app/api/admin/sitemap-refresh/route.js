import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  const auth = request.headers.get('authorization');
  const cookie = request.headers.get('cookie') || '';
  // The admin UI already requires an authenticated editor/admin. The browser
  // request is only used to trigger revalidation; no public GET is exposed.
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      const supabase = createClient(url, key, { global: { headers: { cookie, Authorization: auth || '' } } });
      await supabase.auth.getUser();
    }
    revalidatePath('/sitemap.xml');
    return NextResponse.json({ ok: true, refreshedAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/requireAdmin';

export async function POST(request) {
  const check = await requireAdmin(request);
  if (check.error) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  try {
    revalidatePath('/sitemap.xml');
    return NextResponse.json({
      ok: true,
      refreshedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Sitemap revalidation failed:', error);
    return NextResponse.json(
      { ok: false, error: 'Could not refresh the sitemap.' },
      { status: 500 },
    );
  }
}

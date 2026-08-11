import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

export const metadata = { title: 'Blog — Sultan Pocket' };
export const revalidate = 30;

async function getPosts() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data, error } = await supabase
    .from('posts')
    .select('id,title,slug,excerpt,cover_image_url,created_at')
    .eq('published', true)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

export default async function BlogPage() {
  const posts = await getPosts();
  return (
    <main className="container" style={{ padding: '56px 24px' }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 22 }}>Blog</h1>
      {posts.length === 0 ? (
        <p style={{ fontSize: 14, color: 'var(--text-faint)' }}>No posts yet. Check back soon.</p>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {posts.map((p) => (
            <Link key={p.id} href={`/blog/${p.slug}`} className="card" style={{ display: 'block' }}>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>{p.title}</div>
              {p.excerpt && <div style={{ fontSize: 13.5, color: 'var(--text-dim)' }}>{p.excerpt}</div>}
              <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 8 }}>
                {new Date(p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

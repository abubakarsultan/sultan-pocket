import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';

export const revalidate = 30;

function getClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

async function getPost(slug) {
  const supabase = getClient();
  const { data } = await supabase
    .from('posts')
    .select('title,excerpt,content,cover_image_url,created_at,published,meta_title,meta_description')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }) {
  const post = await getPost(params.slug);
  if (!post) return { title: 'Post not found — Sultan Pocket' };
  const title = post.meta_title || post.title;
  const description = post.meta_description || post.excerpt || undefined;
  return {
    title: `${title} — Sultan Pocket`,
    description,
    openGraph: { title, description },
  };
}

export default async function BlogPostPage({ params }) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  return (
    <main className="container" style={{ padding: '56px 24px', maxWidth: 720 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, lineHeight: 1.25 }}>{post.title}</h1>
      <div style={{ fontSize: 13, color: 'var(--text-faint)', marginBottom: 24 }}>
        {new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
      {post.cover_image_url && (
        <img src={post.cover_image_url} alt={post.title} style={{ width: '100%', borderRadius: 12, marginBottom: 24 }} />
      )}
      <div style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
        {post.content}
      </div>
    </main>
  );
}

import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

export const metadata = {
  title: 'Blog — Sultan Pocket',
  description: 'Practical guides and insights about personal finance, budgeting, saving, and smarter money management.',
  alternates: { canonical: 'https://sultanpocket.online/blog' },
  openGraph: {
    title: 'Blog — Sultan Pocket',
    description: 'Practical guides and insights about personal finance, budgeting, saving, and smarter money management.',
    url: 'https://sultanpocket.online/blog'
  }
};
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
    <main className="container blog-list-page" style={{ padding: '48px 24px 80px' }}>
      <header className="blog-list-header">
        <div>
          <p className="blog-eyebrow">Sultan Pocket</p>
          <h1>Money, made simpler.</h1>
          <p>Practical guides for budgeting, saving, spending smarter, and building better money habits.</p>
        </div>
      </header>

      {posts.length === 0 ? (
        <div className="blog-empty">
          <h2>No posts yet</h2>
          <p>We&apos;re preparing the first guides. Check back soon.</p>
        </div>
      ) : (
        <div className="blog-grid">
          {posts.map((p, index) => (
            <Link key={p.id} href={`/blog/${p.slug}`} className={`blog-card${index === 0 ? ' blog-card-featured' : ''}`}>
              {p.cover_image_url ? (
                <img src={p.cover_image_url} alt="" className="blog-card-image" />
              ) : (
                <div className="blog-card-image blog-card-placeholder" aria-hidden="true"><span>SP</span></div>
              )}
              <div className="blog-card-body">
                <time dateTime={p.created_at}>{new Date(p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
                <h2>{p.title}</h2>
                {p.excerpt && <p>{p.excerpt}</p>}
                <span className="blog-read-more">Read article →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

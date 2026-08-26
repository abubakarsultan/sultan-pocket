import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { getPageSeo, buildPageMetadata } from '@/lib/pageSeo';

export const revalidate = 30;
export async function generateMetadata() { return buildPageMetadata(await getPageSeo('/blog', { title: 'Blog — Sultan Pocket', description: 'Practical personal finance guides, budgeting tips, savings ideas and Sultan Pocket updates.' })); }

async function getPosts() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data, error } = await supabase
    .from('posts')
    .select('id,title,slug,excerpt,content,cover_image_url,category,created_at')
    .eq('published', true)
    .order('created_at', { ascending: false });
  if (error) return { posts: [], error: error.message };
  return { posts: data || [], error: null };
}

function getReadTime(html = '') { const text = html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim(); const words = text ? text.split(/\s+/).length : 0; return Math.max(1, Math.ceil(words / 200)); }

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default async function BlogPage({ searchParams }) {
  const { category: activeCategory } = await searchParams;
  const { posts, error } = await getPosts();
  if (error) console.error('getPosts error:', error);

  const categories = Array.from(new Set(posts.map((p) => p.category || 'General')));
  const featured = posts[0];
  const rest = posts.slice(1);
  const filtered = activeCategory
    ? rest.filter((p) => (p.category || 'General') === activeCategory)
    : rest;

  return (
    <main className="container" style={{ padding: '48px 24px 80px' }}>
      <h1 style={{ fontSize: 30, fontWeight: 700, marginBottom: 28 }}>Blog</h1>

      {posts.length === 0 ? (
        <p style={{ fontSize: 14, color: 'var(--text-faint)' }}>No posts yet. Check back soon.</p>
      ) : (
        <>
          {featured && !activeCategory && (
            <Link href={`/blog/${featured.slug}`} className="blog-featured">
              {featured.cover_image_url ? (
                <img src={featured.cover_image_url} alt={featured.title} className="blog-featured-img" />
              ) : (
                <div className="blog-featured-img blog-img-fallback" />
              )}
              <div className="blog-featured-overlay">
                <span className="blog-badge blog-badge-light">Featured</span>
                <h2>{featured.title}</h2>
                <p>{formatDate(featured.created_at)} · {getReadTime(featured.content)} min read{featured.excerpt ? ` · ${featured.excerpt}` : ''}</p>
              </div>
            </Link>
          )}

          {categories.length > 1 && (
            <nav className="blog-tabs">
              <Link href="/blog" className={`blog-tab${!activeCategory ? ' active' : ''}`}>All</Link>
              {categories.map((c) => (
                <Link key={c} href={`/blog?category=${encodeURIComponent(c)}`} className={`blog-tab${activeCategory === c ? ' active' : ''}`}>
                  {c}
                </Link>
              ))}
            </nav>
          )}

          <div className="blog-grid">
            {filtered.map((p) => (
              <Link key={p.id} href={`/blog/${p.slug}`} className="blog-card">
                {p.cover_image_url ? (
                  <img src={p.cover_image_url} alt={p.title} className="blog-card-img" />
                ) : (
                  <div className="blog-card-img blog-img-fallback" />
                )}
                <div className="blog-card-body">
                  <span className="blog-badge">{p.category || 'General'}</span>
                  <h3>{p.title}</h3>
                  <p className="blog-card-date">{formatDate(p.created_at)} · {getReadTime(p.content)} min read</p>{p.excerpt && <p className="blog-card-excerpt">{p.excerpt}</p>}
                </div>
              </Link>
            ))}
            {filtered.length === 0 && (
              <p style={{ fontSize: 13.5, color: 'var(--text-faint)' }}>No posts in this category yet.</p>
            )}
          </div>
        </>
      )}
    </main>
  );
}

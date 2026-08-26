import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { sanitizeHtml } from '@/lib/sanitizeHtml';

export const revalidate = 30;

function getReadTime(html = '') { const text = html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim(); const words = text ? text.split(/\s+/).length : 0; return Math.max(1, Math.ceil(words / 200)); }

function getClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

async function getPost(slug) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('posts')
    .select('title,excerpt,content,cover_image_url,category,created_at,updated_at,published,meta_title,meta_description')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();
  if (error) console.error('getPost error:', error.message);
  return data;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Post not found — Sultan Pocket' };
  const title = post.meta_title || post.title;
  const description = post.meta_description || post.excerpt || undefined;
  return {
    title: `${title} — Sultan Pocket`,
    description,
    alternates: { canonical: `https://sultanpocket.online/blog/${encodeURIComponent(slug)}` },
    openGraph: { title, description, type: 'article', url: `https://sultanpocket.online/blog/${encodeURIComponent(slug)}`, images: post.cover_image_url ? [{ url: post.cover_image_url, alt: post.title }] : undefined },
    twitter: { card: 'summary_large_image', title, description, images: post.cover_image_url ? [post.cover_image_url] : undefined },
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const supabase = getClient();
  const { data: relatedPosts } = await supabase
    .from('posts')
    .select('id,title,slug,cover_image_url,category,created_at')
    .eq('published', true)
    .eq('category', post.category || 'General')
    .neq('slug', slug)
    .order('created_at', { ascending: false })
    .limit(3);

  const safeContent = sanitizeHtml(post.content || '');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || undefined,
    datePublished: post.created_at,
    dateModified: post.updated_at || post.created_at,
    image: post.cover_image_url ? [post.cover_image_url] : undefined,
    author: { '@type': 'Organization', name: 'Sultan Pocket', url: 'https://sultanpocket.online' },
    mainEntityOfPage: `https://sultanpocket.online/blog/${encodeURIComponent(slug)}`,
  };
  const breadcrumbLd = { '@context':'https://schema.org', '@type':'BreadcrumbList', itemListElement:[
    { '@type':'ListItem', position:1, name:'Home', item:'https://sultanpocket.online/' },
    { '@type':'ListItem', position:2, name:'Blog', item:'https://sultanpocket.online/blog' },
    { '@type':'ListItem', position:3, name:post.title, item:`https://sultanpocket.online/blog/${encodeURIComponent(slug)}` },
  ]};

  return (
    <main className="container blog-article-page" style={{ padding: '42px 24px 80px', maxWidth: 860 }}>
      <nav className="blog-breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>›</span><a href="/blog">Blog</a><span>›</span><span>{post.title}</span></nav>
      <article className="blog-article">
        <span className="blog-badge" style={{ marginBottom: 12, display: 'inline-block' }}>{post.category || 'General'}</span>
        <h1>{post.title}</h1>
        <div className="blog-article-meta">Published {new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · {getReadTime(post.content)} min read</div>
        {post.cover_image_url && <img className="blog-article-cover" src={post.cover_image_url} alt={post.title} />}
        <div className="blog-content" dangerouslySetInnerHTML={{ __html: safeContent }} />
      </article>
      {relatedPosts?.length ? <section className="blog-related"><div className="blog-related-head"><div><span className="wallet-section-kicker">KEEP READING</span><h2>Related posts</h2></div></div><div className="blog-related-grid">{relatedPosts.map(item=><a className="blog-related-card" key={item.id} href={`/blog/${item.slug}`}>{item.cover_image_url ? <img src={item.cover_image_url} alt="" /> : <div className="blog-related-fallback" />}<div><span className="blog-badge">{item.category || 'General'}</span><h3>{item.title}</h3><small>{new Date(item.created_at).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'})}</small></div></a>)}</div></section> : null}
      <div className="blog-article-footer"><a className="btn" href="/blog">← Back to blog</a></div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd).replace(/</g, '\\u003c') }} />
    </main>
  );
}

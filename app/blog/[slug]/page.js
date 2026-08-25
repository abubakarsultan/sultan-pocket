import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { sanitizeBlogHtml } from '@/lib/sanitizeBlogHtml';

export const revalidate = 30;

function getClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://sultanpocket.online').replace(/\/$/, '');
}

async function getPost(slug) {
  const supabase = getClient();
  const { data } = await supabase
    .from('posts')
    .select('id,title,slug,excerpt,content,cover_image_url,created_at,updated_at,published,meta_title,meta_description')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();
  return data;
}

async function getRelatedPosts(postId) {
  const supabase = getClient();
  const { data } = await supabase
    .from('posts')
    .select('id,title,slug,excerpt,cover_image_url,created_at')
    .eq('published', true)
    .neq('id', postId)
    .order('created_at', { ascending: false })
    .limit(3);
  return data || [];
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Post not found — Sultan Pocket' };

  const title = post.meta_title || post.title;
  const description = post.meta_description || post.excerpt || undefined;
  const url = `${siteUrl()}/blog/${post.slug}`;
  const metadata = {
    title: `${title} — Sultan Pocket`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title,
      description,
      publishedTime: post.created_at,
      modifiedTime: post.updated_at || post.created_at,
      images: post.cover_image_url ? [{ url: post.cover_image_url, alt: post.title }] : undefined
    },
    twitter: {
      card: post.cover_image_url ? 'summary_large_image' : 'summary',
      title,
      description,
      images: post.cover_image_url ? [post.cover_image_url] : undefined
    }
  };
  return metadata;
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const related = await getRelatedPosts(post.id);
  const url = `${siteUrl()}/blog/${post.slug}`;
  const safeContent = sanitizeBlogHtml(post.content || '');
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.meta_description || post.excerpt || undefined,
    datePublished: post.created_at,
    dateModified: post.updated_at || post.created_at,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    image: post.cover_image_url ? [post.cover_image_url] : undefined,
    author: { '@type': 'Organization', name: 'Sultan Pocket', url: siteUrl() },
    publisher: { '@type': 'Organization', name: 'Sultan Pocket', url: siteUrl() }
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl() },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteUrl()}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: url }
    ]
  };

  return (
    <main className="container blog-post-page" style={{ padding: '44px 24px 80px' }}>
      <nav className="blog-breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span>›</span><Link href="/blog">Blog</Link><span>›</span><span>{post.title}</span>
      </nav>

      <article className="blog-article">
        <header className="blog-article-header">
          <h1>{post.title}</h1>
          <div className="blog-article-meta">
            <time dateTime={post.created_at}>{new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
            {post.updated_at && post.updated_at !== post.created_at && <span>Updated {new Date(post.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>}
          </div>
        </header>

        {post.cover_image_url && <img className="blog-hero-image" src={post.cover_image_url} alt={post.title} />}

        <div className="blog-content" dangerouslySetInnerHTML={{ __html: safeContent }} />
      </article>

      {related.length > 0 && (
        <section className="blog-related" aria-labelledby="related-posts-title">
          <h2 id="related-posts-title">More from the blog</h2>
          <div className="blog-related-grid">
            {related.map((p) => (
              <Link key={p.id} href={`/blog/${p.slug}`} className="blog-related-card">
                {p.cover_image_url && <img src={p.cover_image_url} alt="" />}
                <div className="blog-related-card-body">
                  <h3>{p.title}</h3>
                  {p.excerpt && <p>{p.excerpt}</p>}
                  <time dateTime={p.created_at}>{new Date(p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</time>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema).replace(/</g, '\\u003c') }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema).replace(/</g, '\\u003c') }} />
    </main>
  );
}

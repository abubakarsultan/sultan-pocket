import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import styles from './blog.module.css';

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
    <main className={`container ${styles.page}`}>
      <header className={styles.listHeader}>
        <p className={styles.eyebrow}>Sultan Pocket</p>
        <h1>Money, made simpler.</h1>
        <p>Practical guides for budgeting, saving, spending smarter, and building better money habits.</p>
      </header>

      {posts.length === 0 ? (
        <div className={styles.empty}>
          <h2>No posts yet</h2>
          <p>We&apos;re preparing the first guides. Check back soon.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {posts.map((p, index) => (
            <Link key={p.id} href={`/blog/${p.slug}`} className={`${styles.card} ${index === 0 ? styles.featured : ''}`}>
              {p.cover_image_url ? (
                <img src={p.cover_image_url} alt="" className={styles.image} />
              ) : (
                <div className={`${styles.image} ${styles.placeholder}`} aria-hidden="true"><span>SP</span></div>
              )}
              <div className={styles.body}>
                <time dateTime={p.created_at}>{new Date(p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
                <h2>{p.title}</h2>
                {p.excerpt && <p>{p.excerpt}</p>}
                <span className={styles.readMore}>Read article →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

import { createClient } from '@supabase/supabase-js';

export const revalidate = 3600;

const FALLBACK_ROUTES = [
  ['/', 1.0, 'weekly'], ['/services', 0.9, 'monthly'], ['/about', 0.6, 'monthly'], ['/blog', 0.9, 'daily'], ['/faq', 0.5, 'monthly'], ['/contact', 0.5, 'monthly'], ['/privacy', 0.3, 'yearly'], ['/terms', 0.3, 'yearly'],
];

export default async function sitemap() {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://sultanpocket.online').replace(/\/$/, '');
  const urls = [];
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { data: pages } = await supabase.from('page_seo').select('path,canonical_url,robots_index,include_in_sitemap,priority,change_frequency,updated_at');
    const pageMap = new Map((pages || []).map(p => [p.path, p]));
    for (const [path, priority, frequency] of FALLBACK_ROUTES) {
      const p = pageMap.get(path);
      if (p && (!p.include_in_sitemap || !p.robots_index)) continue;
      urls.push({ url: p?.canonical_url || `${base}${path}`, lastModified: new Date(p?.updated_at || Date.now()), priority: Number(p?.priority ?? priority), changeFrequency: p?.change_frequency || frequency });
    }
    const { data: posts } = await supabase.from('posts').select('slug,updated_at,created_at').eq('published', true);
    for (const post of posts || []) urls.push({ url: `${base}/blog/${post.slug}`, lastModified: new Date(post.updated_at || post.created_at || Date.now()), priority: 0.7, changeFrequency: 'weekly' });
  } catch {
    for (const [path, priority, frequency] of FALLBACK_ROUTES) urls.push({ url: `${base}${path}`, lastModified: new Date(), priority, changeFrequency: frequency });
  }
  return urls;
}

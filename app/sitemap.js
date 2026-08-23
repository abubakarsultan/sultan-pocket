import { createClient } from '@supabase/supabase-js';

export const revalidate = 3600;

const staticRoutes = ['/', '/features', '/about', '/blog', '/faq', '/contact', '/services', '/privacy', '/terms'];

export default async function sitemap() {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://sultanpocket.online').replace(/\/$/, '');
  const urls = staticRoutes.map((route) => ({ url: `${base}${route}`, lastModified: new Date() }));
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { data } = await supabase.from('posts').select('slug,updated_at,created_at').eq('published', true);
    for (const post of data || []) urls.push({ url: `${base}/blog/${post.slug}`, lastModified: new Date(post.updated_at || post.created_at || Date.now()) });
  } catch {}
  return urls;
}

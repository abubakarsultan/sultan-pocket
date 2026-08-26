import { createClient } from '@supabase/supabase-js';

const BASE = 'https://sultanpocket.online';

export async function getPageSeo(pathname, fallback = {}) {
  const defaults = {
    title: fallback.title || 'Sultan Pocket',
    description: fallback.description || 'Personal finance, made simple.',
    og_title: fallback.og_title || fallback.title || 'Sultan Pocket',
    og_description: fallback.og_description || fallback.description || 'Personal finance, made simple.',
    og_image_url: fallback.og_image_url || `${BASE}/icon-512.png`,
    twitter_title: fallback.twitter_title || fallback.title || 'Sultan Pocket',
    twitter_description: fallback.twitter_description || fallback.description || 'Personal finance, made simple.',
    twitter_image_url: fallback.twitter_image_url || fallback.og_image_url || `${BASE}/icon-512.png`,
    canonical_url: fallback.canonical_url || `${BASE}${pathname}`,
    robots_index: fallback.robots_index !== false,
    robots_follow: fallback.robots_follow !== false,
  };

  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { data } = await supabase.from('page_seo').select('*').eq('path', pathname).maybeSingle();
    if (!data) return defaults;
    return { ...defaults, ...Object.fromEntries(Object.entries(data).filter(([, value]) => value !== null && value !== '')) };
  } catch {
    return defaults;
  }
}

export function buildPageMetadata(seo) {
  const robots = { index: seo.robots_index !== false, follow: seo.robots_follow !== false };
  const metadata = {
    title: seo.title,
    description: seo.description || undefined,
    alternates: { canonical: seo.canonical_url },
    robots,
    openGraph: {
      title: seo.og_title || seo.title,
      description: seo.og_description || seo.description || undefined,
      url: seo.canonical_url,
      siteName: 'Sultan Pocket',
      type: 'website',
      images: seo.og_image_url ? [{ url: seo.og_image_url, alt: seo.og_title || seo.title }] : undefined,
    },
    twitter: {
      card: seo.twitter_image_url || seo.og_image_url ? 'summary_large_image' : 'summary',
      title: seo.twitter_title || seo.title,
      description: seo.twitter_description || seo.description || undefined,
      images: (seo.twitter_image_url || seo.og_image_url) ? [seo.twitter_image_url || seo.og_image_url] : undefined,
    },
  };
  if (seo.keywords) metadata.keywords = seo.keywords;
  return metadata;
}

import './globals.css';
import { createClient } from '@supabase/supabase-js';
import { AuthProvider } from '@/components/AuthProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ThemeManager from '@/components/ThemeManager';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import Assistant from '@/components/assistant/Assistant';
import PageTransition from '@/components/PageTransition';
import SmoothScrollProvider from '@/components/SmoothScrollProvider';

export async function generateMetadata() {
  const fallback = {
    title: 'Sultan Pocket — Manage your money, your way',
    description: 'Sultan Pocket helps you track expenses, plan budgets, and grow savings — all your personal finance tools in one place.',
    og_image_url: 'https://sultanpocket.online/icon-512.png',
  };
  let settings = fallback;
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { data } = await supabase.from('site_settings').select('site_title,site_description,og_image_url').eq('id', 1).maybeSingle();
    if (data) settings = { ...fallback, site_title: data.site_title, site_description: data.site_description, og_image_url: data.og_image_url || fallback.og_image_url };
  } catch {}
  const title = settings.site_title || fallback.title;
  const description = settings.site_description || fallback.description;
  return {
    title,
    description,
    metadataBase: new URL('https://sultanpocket.online'),
    manifest: '/manifest.json',
    icons: { icon: '/favicon.ico', shortcut: '/favicon.ico', apple: '/icon-192.png' },
    robots: { index: true, follow: true },
    openGraph: { title, description, url: 'https://sultanpocket.online', siteName: 'Sultan Pocket', type: 'website', images: [{ url: settings.og_image_url, alt: title }] },
    twitter: { card: 'summary_large_image', title, description, images: [settings.og_image_url] },
  };
}

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F8F7F4' },
    { media: '(prefers-color-scheme: dark)', color: '#141414' },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <a href="#main-content" className="skip-link">Skip to content</a>
        <ThemeManager />
        <ServiceWorkerRegister />
        <AuthProvider>
          <SmoothScrollProvider>
          <Navbar />
          <div id="main-content"><PageTransition>{children}</PageTransition></div>
          <Footer />
          <Assistant />
          </SmoothScrollProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

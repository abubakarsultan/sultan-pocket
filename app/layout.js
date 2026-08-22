import './globals.css';
import './liquid-glass.css';
import { AuthProvider } from '@/components/AuthProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ThemeManager from '@/components/ThemeManager';
import LiquidBackground from '@/components/LiquidBackground';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import Assistant from '@/components/assistant/Assistant';
import PageTransition from '@/components/PageTransition';

export const metadata = {
  title: 'Sultan Pocket — Manage your money, your way',
  description: 'Sultan Pocket helps you track expenses, plan budgets, and grow savings — all your personal finance tools in one place.',
  metadataBase: new URL('https://sultanpocket.online'),
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico', shortcut: '/favicon.ico', apple: '/icon-192.png' },
  robots: { index: true, follow: true },
  openGraph: { title: 'Sultan Pocket', description: 'Track expenses, plan budgets, and grow savings — all in one place.', url: 'https://sultanpocket.online', siteName: 'Sultan Pocket', type: 'website' },
};

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
        <LiquidBackground />
        <ServiceWorkerRegister />
        <AuthProvider>
          <Navbar />
          <div id="main-content"><PageTransition>{children}</PageTransition></div>
          <Footer />
          <Assistant />
        </AuthProvider>
      </body>
    </html>
  );
}

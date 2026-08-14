import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ThemeManager from '@/components/ThemeManager';
import Assistant from '@/components/assistant/Assistant';

export const metadata = {
  title: 'Sultan Pocket — Manage your money, your way',
  description: 'Sultan Pocket helps you track expenses, plan budgets, and grow savings — all your personal finance tools in one place.',
  metadataBase: new URL('https://sultanpocket.online'),
  icons: { icon: '/favicon.ico', shortcut: '/favicon.ico', apple: '/favicon.ico' },
  robots: { index: true, follow: true },
  openGraph: { title: 'Sultan Pocket', description: 'Track expenses, plan budgets, and grow savings — all in one place.', url: 'https://sultanpocket.online', siteName: 'Sultan Pocket', type: 'website' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <a href="#main-content" className="skip-link">Skip to content</a>
        <ThemeManager />
        <AuthProvider>
          <Navbar />
          <div id="main-content">{children}</div>
          <Footer />
          <Assistant />
        </AuthProvider>
      </body>
    </html>
  );
}

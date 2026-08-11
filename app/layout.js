import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Sultan Pocket — Manage your money, your way',
  description: 'Sultan Pocket helps you track expenses, plan budgets, and grow savings — all your personal finance tools in one place.',
  metadataBase: new URL('https://sultanpocket.online'),
  openGraph: {
    title: 'Sultan Pocket',
    description: 'Track expenses, plan budgets, and grow savings — all in one place.',
    url: 'https://sultanpocket.online',
    siteName: 'Sultan Pocket',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}

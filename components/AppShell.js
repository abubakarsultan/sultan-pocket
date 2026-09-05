'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useStandalone } from '@/lib/useStandalone';
import ProfileMenu from './ProfileMenu';
import ThemeToggle from './ThemeToggle';

const TABS = [
  ['/dashboard', '▦', 'Dashboard'],
  ['/dashboard/expense-tracker', '💳', 'Expenses'],
  ['/dashboard/budget', '📊', 'Budget'],
];

const MORE_LINKS = [
  ['/dashboard/goals', '🐖', 'Savings goals'],
  ['/dashboard/bills', '🧾', 'Bills & subscriptions'],
  ['/dashboard/security', '🔒', 'Settings & Security'],
  ['/contact', '✉️', 'Contact'],
  ['/faq', '❓', 'Help'],
];

// Sections that already have their own full navigation shell
// (the wallet sidebar, or the admin panel shell). AppShell steps
// aside there so we never show two navigation bars at once.
const SELF_CONTAINED_PREFIXES = ['/dashboard/expense-tracker', '/dashboard/admin'];

export default function AppShell({ children }) {
  const standalone = useStandalone();
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('is-app-shell', standalone);
    return () => document.body.classList.remove('is-app-shell');
  }, [standalone]);

  // On the normal website (browser tab), leave every page exactly as it is today.
  if (!standalone) return children;

  // Sections with their own shell keep their own navigation untouched.
  if (SELF_CONTAINED_PREFIXES.some((p) => pathname?.startsWith(p))) return children;

  const isActive = (href) => (href === '/dashboard' ? pathname === '/dashboard' : pathname?.startsWith(href));

  return (
    <div className="app-shell">
      <header className="app-shell-topbar">
        <Link href="/dashboard" className="app-shell-brand" onClick={() => setMoreOpen(false)}>
          <img src="/icon-192.png" alt="" width={26} height={26} />
          <span>Sultan Pocket</span>
        </Link>
        <div className="app-shell-topbar-actions">
          <ThemeToggle />
          <ProfileMenu compact />
        </div>
      </header>

      <div className="app-shell-content">{children}</div>

      <nav className="app-shell-bottom-nav" aria-label="App navigation">
        {TABS.map(([href, icon, label]) => (
          <Link key={href} href={href} className={isActive(href) ? 'active' : ''} onClick={() => setMoreOpen(false)}>
            <i aria-hidden="true">{icon}</i>
            <span>{label}</span>
          </Link>
        ))}
        <button type="button" className={moreOpen ? 'active' : ''} onClick={() => setMoreOpen(true)}>
          <i aria-hidden="true">•••</i>
          <span>More</span>
        </button>
      </nav>

      {moreOpen && (
        <div className="app-shell-more-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setMoreOpen(false); }}>
          <section className="app-shell-more-sheet" role="dialog" aria-modal="true" aria-label="More">
            <div className="app-shell-more-head">
              <strong>More</strong>
              <button type="button" onClick={() => setMoreOpen(false)} aria-label="Close">×</button>
            </div>
            <div className="app-shell-more-grid">
              {MORE_LINKS.map(([href, icon, label]) => (
                <Link key={href} href={href} onClick={() => setMoreOpen(false)}>
                  <i>{icon}</i><span>{label}</span><b>→</b>
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

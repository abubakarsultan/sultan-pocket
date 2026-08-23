'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  ['/dashboard/admin', '▦', 'Overview', 'editor'],
  ['/dashboard/admin/users', '◍', 'Users', 'admin'],
  ['/dashboard/admin/blog', '✎', 'Blog', 'editor'],
  ['/dashboard/admin/messages', '✉', 'Messages', 'editor'],
  ['/dashboard/admin/seo', '◈', 'SEO', 'admin'],
];

export default function AdminShell({ children, role, title = 'Admin' }) {
  const pathname = usePathname();
  const visibleItems = NAV_ITEMS.filter((item) => item[3] === 'editor' || role === 'admin');

  return (
    <div className="wallet-shell">
      <aside className="wallet-sidebar">
        <div className="wallet-brand">
          <span>SP</span>
          <b>Admin</b>
        </div>
        <nav>
          {visibleItems.map(([href, icon, label]) => (
            <Link key={href} href={href} className={pathname === href ? 'active' : ''}>
              <i>{icon}</i> {label}
            </Link>
          ))}
        </nav>
        <div className="wallet-side-foot">
          <Link href="/dashboard">← Back to dashboard</Link>
        </div>
      </aside>
      <main className="wallet-main">
        <div className="wallet-topbar">
          <div className="wallet-page-title">
            <span>ADMIN AREA</span>
            <h1>{title}</h1>
          </div>
        </div>
        <div className="wallet-content">{children}</div>
      </main>
    </div>
  );
}

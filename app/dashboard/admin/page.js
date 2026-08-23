'use client';

import Link from 'next/link';

const CARDS = [
  { href: '/dashboard/admin/users', icon: '◍', title: 'Users', desc: 'Invite users, change roles, suspend or remove accounts.' },
  { href: '/dashboard/admin/blog', icon: '✎', title: 'Blog', desc: 'Write, edit, and publish posts, with per-post SEO fields.' },
  { href: '/dashboard/admin/seo', icon: '◈', title: 'SEO settings', desc: 'Site-wide title, description, and social preview image.' },
];

export default function AdminOverviewPage() {
  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--text-faint)', marginBottom: 20 }}>
        Pick an area to manage.
      </p>
      <div className="wallet-grid three">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href} className="wallet-panel" style={{ display: 'block' }}>
            <div className="action-icon" style={{ marginBottom: 12 }}>{c.icon}</div>
            <h2 style={{ marginBottom: 4 }}>{c.title}</h2>
            <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

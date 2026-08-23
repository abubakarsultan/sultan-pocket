'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

const CARDS = [
  { href: '/dashboard/admin/users', icon: '◍', title: 'Users', desc: 'Invite users, change roles, suspend or remove accounts.' },
  { href: '/dashboard/admin/blog', icon: '✎', title: 'Blog', desc: 'Write, edit, and publish posts, with per-post SEO fields.' },
  { href: '/dashboard/admin/messages', icon: '✉', title: 'Messages', desc: 'View contact form submissions from visitors.' },
  { href: '/dashboard/admin/seo', icon: '◈', title: 'SEO settings', desc: 'Site-wide title, description, and social preview image.' },
];

function StatCard({ label, value, accent }) {
  return (
    <div className="wallet-card" style={{ '--accent': accent || 'var(--signal)' }}>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.rpc('admin_dashboard_stats').then(({ data, error }) => {
      if (error) setError(error.message);
      else setStats(data);
    });
  }, []);

  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--text-faint)', marginBottom: 20 }}>
        A quick look at how things are going, then pick an area to manage.
      </p>

      {error && <div className="form-error" style={{ marginBottom: 15 }}>{error}</div>}

      <div className="wallet-grid four">
        <StatCard label="Total users" value={stats ? stats.total_users : '…'} />
        <StatCard label="New this week" value={stats ? stats.new_users_this_week : '…'} accent="var(--success)" />
        <StatCard label="Suspended" value={stats ? stats.suspended_users : '…'} accent="var(--danger)" />
        <StatCard label="Unread messages" value={stats ? stats.unread_messages : '…'} accent="var(--gold, #B07F33)" />
      </div>
      <div className="wallet-grid three">
        <StatCard label="Published posts" value={stats ? stats.published_posts : '…'} />
        <StatCard label="Draft posts" value={stats ? stats.draft_posts : '…'} />
        <StatCard label="Total transactions (all users)" value={stats ? stats.total_transactions : '…'} />
      </div>

      <div className="wallet-grid three" style={{ marginTop: 6 }}>
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

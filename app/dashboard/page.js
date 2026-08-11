'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

const TOOLS = [
  { icon: '💳', name: 'Expense tracker', desc: 'Track spending and balances.', href: '/tools/wallet.html', ready: true },
  { icon: '📊', name: 'Budget planner', desc: 'Coming soon.', href: '#', ready: false },
  { icon: '🐖', name: 'Savings goals', desc: 'Coming soon.', href: '#', ready: false },
];

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/signin');
  }, [loading, user, router]);

  if (loading || !user) {
    return <main style={{ padding: 60, textAlign: 'center', color: 'var(--text-faint)' }}>Loading…</main>;
  }

  return (
    <main className="container" style={{ padding: '48px 24px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>
        Welcome, {user.user_metadata?.username || user.email}
      </h1>
      <p style={{ fontSize: 14, color: 'var(--text-faint)', marginBottom: 28 }}>Choose a tool to get started.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
        {TOOLS.map((t) => (
          <a key={t.name} href={t.ready ? t.href : undefined} className="card" style={{ opacity: t.ready ? 1 : 0.55, cursor: t.ready ? 'pointer' : 'default' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--signal-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, marginBottom: 14 }}>
              {t.icon}
            </div>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{t.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>{t.ready ? t.desc : 'Coming soon'}</div>
          </a>
        ))}
      </div>
    </main>
  );
}

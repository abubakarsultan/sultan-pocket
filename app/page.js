import Link from 'next/link';

const TOOLS = [
  { icon: '💳', name: 'Expense tracker', desc: 'Log spending across cash and online, organized by category.', href: '/dashboard/wallet' },
  { icon: '📊', name: 'Budget planner', desc: 'Set monthly limits per category and stay on track.' },
  { icon: '🐖', name: 'Savings goals', desc: 'Set money aside and watch your progress grow.' },
];

export default function HomePage() {
  return (
    <main>
      <section style={{ textAlign: 'center', padding: '80px 24px 56px' }}>
        <h1 style={{ fontSize: 40, fontWeight: 700, marginBottom: 14, lineHeight: 1.15 }}>
          Manage your money,<br />your way
        </h1>

        <p style={{ fontSize: 16, color: 'var(--text-dim)', maxWidth: 480, margin: '0 auto 28px' }}>
          Track expenses, plan budgets, and grow savings — all your personal finance tools in one place.
        </p>

        <Link
          href="/signin"
          className="btn btn-primary"
          style={{ padding: '13px 28px', fontSize: 15 }}
        >
          Get started free
        </Link>
      </section>

      <section className="container" style={{ paddingBottom: 60 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
            gap: 14
          }}
        >
          {TOOLS.map((t) => (
            t.href ? (
              <Link
                key={t.name}
                href={t.href}
                className="card"
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'block'
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'var(--signal-tint)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 19,
                    marginBottom: 14
                  }}
                >
                  {t.icon}
                </div>

                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                  {t.name}
                </div>

                <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>
                  {t.desc}
                </div>
              </Link>
            ) : (
              <div key={t.name} className="card">
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'var(--signal-tint)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 19,
                    marginBottom: 14
                  }}
                >
                  {t.icon}
                </div>

                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                  {t.name}
                </div>

                <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>
                  {t.desc}
                </div>
              </div>
            )
          ))}
        </div>
      </section>
    </main>
  );
}

import Link from 'next/link';

export const metadata = { title: 'Page not found — Sultan Pocket' };

export default function NotFound() {
  return (
    <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div className="card" style={{ maxWidth: 440, textAlign: 'center', padding: 32 }}>
        <div style={{ fontSize: 44, fontWeight: 700, opacity: .35 }}>404</div>
        <h1 style={{ marginTop: 4 }}>Page not found</h1>
        <p style={{ color: 'var(--text-dim)' }}>
          The page you're looking for doesn't exist or may have moved.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
          <Link href="/" className="btn btn-primary">Back to home</Link>
          <Link href="/dashboard" className="btn btn-ghost">Go to dashboard</Link>
        </div>
      </div>
    </main>
  );
}

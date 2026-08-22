'use client';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Sultan Pocket route error:', error);
  }, [error]);

  return (
    <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div className="card" style={{ maxWidth: 420, textAlign: 'center', padding: 32 }}>
        <h1 style={{ marginTop: 0 }}>Something went wrong</h1>
        <p style={{ color: 'var(--text-dim)' }}>
          An unexpected error happened while loading this page. Your data is safe — this is just a display hiccup.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
          <button type="button" className="btn btn-primary" onClick={() => reset()}>Try again</button>
          <Link href="/" className="btn btn-ghost">Go home</Link>
        </div>
      </div>
    </main>
  );
}

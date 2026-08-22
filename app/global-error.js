'use client';
import { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('Sultan Pocket root layout error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#F8F7F4', color: '#141414' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ maxWidth: 420, textAlign: 'center', border: '1px solid #E5E3DD', borderRadius: 16, padding: 32, background: '#fff' }}>
            <h1 style={{ marginTop: 0 }}>Sultan Pocket hit a snag</h1>
            <p style={{ color: '#6b6b6b' }}>
              Something failed to load. Please refresh the page — if this keeps happening, contact support.
            </p>
            <button
              type="button"
              onClick={() => reset()}
              style={{ marginTop: 16, padding: '10px 20px', borderRadius: 999, border: 'none', background: '#0057FF', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
            >
              Reload
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

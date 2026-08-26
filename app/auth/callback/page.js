'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

function CallbackContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function finish() {
      // Supabase sends failures (expired/already-used links, etc.) as hash
      // params rather than a query string: #error=...&error_code=otp_expired
      if (typeof window !== 'undefined' && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const hashError = hashParams.get('error');
        if (hashError) {
          const code = hashParams.get('error_code');
          if (active) {
            setError(
              code === 'otp_expired'
                ? "This link has expired or was already used. This can happen if it sat unopened for a while, or if your email app 'previewed' the link automatically. Ask whoever sent it to send a new one, or use 'Forgot password' to get a fresh link yourself."
                : hashParams.get('error_description')?.replace(/\+/g, ' ') || 'This link is no longer valid.'
            );
          }
          return;
        }
      }

      const code = params.get('code');
      const flow = params.get('flow');

      if (code) {
        const { error: e } = await supabase.auth.exchangeCodeForSession(code);
        if (e) {
          if (active) setError(e.message);
          return;
        }
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (active) setError('We could not complete email verification. Please sign in and try again.');
          return;
        }
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        if (active) setError(userError?.message || 'Could not load your account.');
        return;
      }

      if (flow === 'invite') {
        if (active) router.replace('/reset-password?mode=invite');
        return;
      }

      const metadata = user.user_metadata || {};
      const destination = metadata.currency ? '/dashboard' : '/onboarding';
      if (active) router.replace(destination);
    }

    finish();
    return () => { active = false; };
  }, [params, router]);

  if (error) {
    return (
      <main style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', padding: 20 }}>
        <section className="card" style={{ maxWidth: 440, width: '100%', padding: 28, textAlign: 'center' }}>
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>Verification could not be completed</h1>
          <p style={{ color: 'var(--text-faint)', fontSize: 13, marginBottom: 18 }}>{error}</p>
          <button className="btn btn-primary" onClick={() => router.push('/signin')}>Go to sign in</button>
        </section>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', padding: 20 }}>
      <section className="card" style={{ maxWidth: 440, width: '100%', padding: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 34, marginBottom: 10 }}>✓</div>
        <h1 style={{ fontSize: 21, marginBottom: 8 }}>Setting up your account…</h1>
        <p style={{ color: 'var(--text-faint)', fontSize: 13 }}>Please wait while we finish signing you in.</p>
      </section>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <main style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', padding: 20 }}>
        <section className="card" style={{ maxWidth: 440, width: '100%', padding: 28, textAlign: 'center' }}>
          <h1 style={{ fontSize: 21, marginBottom: 8 }}>Setting up your account…</h1>
          <p style={{ color: 'var(--text-faint)', fontSize: 13 }}>Please wait while we finish signing you in.</p>
        </section>
      </main>
    }>
      <CallbackContent />
    </Suspense>
  );
}

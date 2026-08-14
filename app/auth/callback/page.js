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
      const next = params.get('next') || '/onboarding';
      const code = params.get('code');

      if (code) {
        const { error: e } = await supabase.auth.exchangeCodeForSession(code);
        if (e) {
          if (active) setError(e.message);
          return;
        }
      } else {
        const {
          data: { session }
        } = await supabase.auth.getSession();

        if (!session) {
          if (active) {
            setError(
              'We could not complete email verification. Please sign in and try again.'
            );
          }
          return;
        }
      }

      if (active) router.replace(next);
    }

    finish();

    return () => {
      active = false;
    };
  }, [params, router]);

  if (error) {
    return (
      <main
        style={{
          minHeight: '70vh',
          display: 'grid',
          placeItems: 'center',
          padding: 20
        }}
      >
        <section
          className="card"
          style={{
            maxWidth: 440,
            width: '100%',
            padding: 28,
            textAlign: 'center'
          }}
        >
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>
            Verification could not be completed
          </h1>
          <p
            style={{
              color: 'var(--text-faint)',
              fontSize: 13,
              marginBottom: 18
            }}
          >
            {error}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => router.push('/signin')}
          >
            Go to sign in
          </button>
        </section>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: '70vh',
        display: 'grid',
        placeItems: 'center',
        padding: 20
      }}
    >
      <section
        className="card"
        style={{
          maxWidth: 440,
          width: '100%',
          padding: 28,
          textAlign: 'center'
        }}
      >
        <div style={{ fontSize: 34, marginBottom: 10 }}>✓</div>
        <h1 style={{ fontSize: 21, marginBottom: 8 }}>
          Verifying your email…
        </h1>
        <p style={{ color: 'var(--text-faint)', fontSize: 13 }}>
          Please wait while we finish setting up your account.
        </p>
      </section>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            minHeight: '70vh',
            display: 'grid',
            placeItems: 'center',
            padding: 20
          }}
        >
          <section
            className="card"
            style={{
              maxWidth: 440,
              width: '100%',
              padding: 28,
              textAlign: 'center'
            }}
          >
            <h1 style={{ fontSize: 21, marginBottom: 8 }}>
              Verifying your email…
            </h1>
            <p style={{ color: 'var(--text-faint)', fontSize: 13 }}>
              Please wait while we finish setting up your account.
            </p>
          </section>
        </main>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}

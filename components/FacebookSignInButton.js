'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function FacebookSignInButton({ label = 'Continue with Facebook' }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleFacebookSignIn() {
    setError('');
    setBusy(true);
    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : undefined;

    const { error: signInErr } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: redirectTo ? { redirectTo } : undefined,
    });

    if (signInErr) {
      setBusy(false);
      setError(signInErr.message);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleFacebookSignIn}
        disabled={busy}
        className="btn btn-block"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
      >
        <span style={{ fontWeight: 800, fontSize: 18, lineHeight: 1 }}>f</span>
        {busy ? 'Connecting…' : label}
      </button>
      {error && <div className="form-error" style={{ display: 'block', marginTop: 8 }}>{error}</div>}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function GoogleSignInButton({ label = 'Continue with Google' }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleGoogleSignIn() {
    setError('');
    setBusy(true);
    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback?next=/dashboard`
      : undefined;

    const { error: signInErr } = await supabase.auth.signInWithOAuth({
      provider: 'google',
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
        onClick={handleGoogleSignIn}
        disabled={busy}
        className="btn btn-block"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M21.35 12.27c0-.79-.07-1.55-.23-2.27H12v4.3h5.22a4.47 4.47 0 0 1-1.94 2.93v2.44h3.14c1.84-1.69 2.93-4.18 2.93-7.4Z" />
          <path fill="#34A853" d="M12 21.99c2.63 0 4.84-.87 6.45-2.35l-3.14-2.44c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.52A9.75 9.75 0 0 0 12 21.99Z" />
          <path fill="#FBBC05" d="M6.54 14.09A5.86 5.86 0 0 1 6.23 12c0-.73.12-1.43.31-2.09V7.39H3.3A9.98 9.98 0 0 0 2.25 12c0 1.66.4 3.22 1.05 4.61l3.24-2.52Z" />
          <path fill="#EA4335" d="M12 5.88c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.83 2.97 14.63 2 12 2a9.75 9.75 0 0 0-8.7 5.39l3.24 2.52C7.31 7.6 9.46 5.88 12 5.88Z" />
        </svg>
        {busy ? 'Connecting…' : label}
      </button>
      {error && <div className="form-error" style={{ display: 'block', marginTop: 8 }}>{error}</div>}
    </div>
  );
}

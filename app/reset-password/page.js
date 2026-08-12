'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

async function getSupabase() {
  const module = await import('@/lib/supabaseClient');
  return module.supabase;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;

    async function prepareResetSession() {
      try {
        const supabase = await getSupabase();
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');

        // PKCE reset links use ?code=... . Older/implicit links can return
        // access_token + refresh_token in the URL hash.
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        } else {
          const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
          const accessToken = hash.get('access_token');
          const refreshToken = hash.get('refresh_token');

          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (sessionError) throw sessionError;
          }
        }

        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!active) return;
        if (!data.session) {
          setError('This reset link is invalid or has expired. Request a new one.');
          setReady(false);
        } else {
          setReady(true);
        }
      } catch (err) {
        if (active) {
          setReady(false);
          setError(err?.message || 'This reset link is invalid or has expired. Request a new one.');
        }
      } finally {
        if (active) setChecking(false);
      }
    }

    prepareResetSession();
    return () => {
      active = false;
    };
  }, []);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setNotice('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      const supabase = await getSupabase();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      setNotice('Password updated successfully. Redirecting to sign in…');
      await supabase.auth.signOut();
      window.setTimeout(() => router.replace('/signin'), 900);
    } catch (err) {
      setError(err?.message || 'Unable to update your password. Please request a new reset link.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <form onSubmit={submit} className="card" style={{ width: '100%', maxWidth: 380 }}>
        <h1 style={{ fontSize: 19, fontWeight: 700, marginBottom: 4, textAlign: 'center' }}>
          Choose a new password
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-faint)', textAlign: 'center', marginBottom: 20 }}>
          Use a strong password you do not reuse elsewhere.
        </p>

        {checking && <div className="form-notice" style={{ display: 'block' }}>Checking your reset link…</div>}
        {error && <div className="form-error" style={{ display: 'block' }}>{error}</div>}
        {notice && <div className="form-notice" style={{ display: 'block' }}>{notice}</div>}

        {ready && !checking && (
          <>
            <div className="field">
              <label htmlFor="new-password">New password</label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="confirm-password">Confirm password</label>
              <input
                id="confirm-password"
                type="password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
              {busy ? 'Updating…' : 'Update password'}
            </button>
          </>
        )}
      </form>
    </main>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

function PasswordInput({ id, label, value, onChange, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          style={{ paddingRight: 44 }}
          required
        />
        <button
          type="button"
          onClick={() => setShow((current) => !current)}
          aria-label={show ? `Hide ${label}` : `Show ${label}`}
          style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', border: 0, background: 'transparent', padding: 7, color: 'var(--text-faint)', cursor: 'pointer' }}
        >
          {show ? '🙈' : '👁'}
        </button>
      </div>
    </div>
  );
}

function passwordScore(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

export default function SecurityPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data, error: authError }) => {
      if (!active) return;
      if (authError || !data.user) {
        router.replace('/signin?next=/dashboard/security');
        return;
      }
      setUser(data.user);
      setLoading(false);
    });
    return () => { active = false; };
  }, [router]);

  async function updatePassword(event) {
    event.preventDefault();
    setError('');
    setNotice('');

    if (newPassword.length < 8) {
      setError('Use at least 8 characters for your new password.');
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setError('Use at least one uppercase letter, one lowercase letter, and one number.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setBusy(false);

    if (updateError) {
      setError(updateError.message || 'Could not update your password.');
      return;
    }

    setNewPassword('');
    setConfirmPassword('');
    setNotice('Password updated successfully.');
  }

  async function signOutEverywhere() {
    setError('');
    setNotice('');
    const confirmed = window.confirm('Sign out from Sultan Pocket on all devices and browsers?');
    if (!confirmed) return;

    setBusy(true);
    const { error: signOutError } = await supabase.auth.signOut({ scope: 'global' });
    setBusy(false);

    if (signOutError) {
      setError(signOutError.message || 'Could not sign out everywhere.');
      return;
    }
    router.replace('/signin');
  }

  if (loading) {
    return <main style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', color: 'var(--text-faint)' }}>Loading security settings…</main>;
  }

  const score = passwordScore(newPassword);
  const strength = score <= 1 ? 'Weak' : score === 2 ? 'Fair' : score === 3 ? 'Good' : 'Strong';

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '28px 20px 60px' }}>
      <button type="button" onClick={() => router.back()} style={{ border: 0, background: 'transparent', color: 'var(--signal)', padding: 0, cursor: 'pointer', marginBottom: 16 }}>← Back</button>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>Security</h1>
        <p style={{ color: 'var(--text-faint)', marginTop: 7 }}>Manage your password and active account sessions.</p>
      </div>

      {error && <div className="form-error" style={{ display: 'block', marginBottom: 16 }} role="alert">{error}</div>}
      {notice && <div className="form-notice" style={{ display: 'block', marginBottom: 16 }} role="status">{notice}</div>}

      <section className="card" style={{ padding: 22, marginBottom: 16 }}>
        <h2 style={{ fontSize: 17, marginTop: 0, marginBottom: 5 }}>Change password</h2>
        <p style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 0, marginBottom: 18 }}>
          Signed in as <strong style={{ color: 'var(--text)' }}>{user?.email}</strong>
        </p>
        <form onSubmit={updatePassword}>
          <PasswordInput id="security-new-password" label="New password" value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
          {newPassword && (
            <p style={{ fontSize: 12, marginTop: -6, color: score >= 3 ? 'var(--text)' : 'var(--text-faint)' }}>
              Password strength: <strong>{strength}</strong>
            </p>
          )}
          <PasswordInput id="security-confirm-password" label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Updating…' : 'Update password'}</button>
        </form>
      </section>

      <section className="card" style={{ padding: 22 }}>
        <h2 style={{ fontSize: 17, marginTop: 0, marginBottom: 5 }}>Sessions</h2>
        <p style={{ fontSize: 13, color: 'var(--text-faint)', lineHeight: 1.6 }}>
          If you used Sultan Pocket on a shared or lost device, sign out everywhere. You will need to sign in again on this device too.
        </p>
        <button type="button" className="btn" onClick={signOutEverywhere} disabled={busy}>Sign out everywhere</button>
      </section>
    </main>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthProvider';

export default function SecurityPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [globalBusy, setGlobalBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [passwordSet, setPasswordSet] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/signin'); return; }
    supabase.rpc('get_my_auth_status').then(({ data }) => {
      if (data) setPasswordSet(!!data.password_set);
    });
  }, [loading, user, router]);

  async function changePassword(event) {
    event.preventDefault();
    setError(''); setNotice('');
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirm) { setError('Passwords do not match.'); return; }
    setBusy(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (sessionError || !accessToken) throw new Error('Your session has expired. Please sign in again.');

      const response = await fetch('/api/account/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ password: newPassword }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Could not update your password.');

      // Verify the password against the real Auth endpoint before reporting success.
      const email = user.email;
      if (!email) throw new Error('Your account has no email address for password sign-in.');
      const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: newPassword });
      if (verifyError) throw new Error('The password was saved, but email sign-in could not verify it. Please try creating it again.');

      setPasswordSet(true);
      setNewPassword(''); setConfirm('');
      setNotice('Password updated and verified. You can now sign in with your email and this password.');
    } catch (err) {
      setError(err?.message || 'Could not update your password.');
    } finally {
      setBusy(false);
    }
  }

  async function signOutEverywhere() {
    if (!window.confirm('Sign out of Sultan Pocket on all devices? You will also be signed out here.')) return;
    setGlobalBusy(true); setError(''); setNotice('');
    const { error: signOutError } = await supabase.auth.signOut({ scope: 'global' });
    if (signOutError) {
      setError(signOutError.message || 'Could not sign out of all sessions.');
      setGlobalBusy(false);
      return;
    }
    router.replace('/signin');
  }

  if (loading || !user) return <main className="container" style={{ padding: 50 }}><div className="wallet-empty">Loading…</div></main>;

  const providers = user.app_metadata?.providers || [];
  const googleConnected = providers.includes('google');
  const emailConnected = providers.includes('email') || providers.length === 0;

  return (
    <main className="container settings-page" style={{ padding: '42px 24px 80px' }}>
      <div className="settings-head">
        <div><span className="wallet-section-kicker">ACCOUNT</span><h1>Settings & Security</h1><p>Manage your login methods, password, sessions and account security.</p></div>
      </div>
      {error && <div className="form-error settings-message">{error}</div>}
      {notice && <div className="form-notice settings-message">{notice}</div>}

      <div className="settings-layout">
        <aside className="settings-nav">
          <a href="#account">Account</a>
          <a className="active" href="#security">Security</a>
          <a href="#sessions">Sessions</a>
          <a className="danger" href="#danger-zone">Danger zone</a>
        </aside>

        <div className="settings-content">
          <section id="account" className="settings-section wallet-panel">
            <div className="settings-section-head"><div><h2>Account</h2><p>Your account identity and connected sign-in methods.</p></div></div>
            <div className="settings-detail-grid">
              <div><span>Email</span><strong>{user.email || '—'}</strong></div>
              <div><span>Account status</span><strong>Active</strong></div>
              <div><span>Email login</span><strong>{emailConnected ? 'Available' : 'Not connected'}</strong></div>
              <div><span>Google login</span><strong>{googleConnected ? 'Connected' : 'Not connected'}</strong></div>
            </div>
          </section>

          <section id="security" className="settings-section wallet-panel">
            <div className="settings-section-head"><div><h2>Security</h2><p>Create or change the password used for email sign-in.</p></div><span className={`settings-status ${passwordSet ? 'good' : 'pending'}`}>{passwordSet ? 'Password set' : 'No password set'}</span></div>
            <form onSubmit={changePassword} className="settings-password-form">
              <div className="field"><label htmlFor="settings-new-password">New password</label><input id="settings-new-password" type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} autoComplete="new-password" placeholder="At least 6 characters" required /></div>
              <div className="field"><label htmlFor="settings-confirm-password">Confirm password</label><input id="settings-confirm-password" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} autoComplete="new-password" placeholder="Repeat your password" required /></div>
              <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : passwordSet ? 'Change password' : 'Create password'}</button>
            </form>
            <p className="settings-help">If you originally joined with Google or an invite, creating a password also enables email + password sign-in for this account.</p>
          </section>

          <section id="sessions" className="settings-section wallet-panel">
            <div className="settings-section-head"><div><h2>Sessions</h2><p>End active sessions on your other devices.</p></div></div>
            <button className="btn" onClick={signOutEverywhere} disabled={globalBusy}>{globalBusy ? 'Signing out…' : 'Sign out of all devices'}</button>
            <p className="settings-help">You will be signed out on this device too and can sign back in normally.</p>
          </section>

          <section id="danger-zone" className="settings-section wallet-panel settings-danger">
            <div className="settings-section-head"><div><h2>Danger zone</h2><p>Permanent account actions should be used carefully.</p></div></div>
            <a className="btn profile-delete-btn" href={`/u/${encodeURIComponent(user.user_metadata?.username || user.email?.split('@')[0] || 'user')}#account-actions`}>Open account actions</a>
          </section>
        </div>
      </div>
    </main>
  );
}

'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import GoogleSignInButton from '@/components/GoogleSignInButton';

function PasswordField({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="field">
      <label>{label}</label>
      <div style={{ position: 'relative' }}>
        <input type={show ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder} style={{ paddingRight: 38 }} />
        <button type="button" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow((s) => !s)} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-faint)', fontSize: 14 }}>{show ? '🙈' : '👁'}</button>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const value = username.trim();
    if (!value) { setUsernameStatus(''); return; }
    if (!/^[a-zA-Z0-9_.]{3,20}$/.test(value)) { setUsernameStatus('invalid'); return; }
    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      const { data, error: checkErr } = await supabase.rpc('is_username_taken', { uname: value });
      if (checkErr) setUsernameStatus('error');
      else setUsernameStatus(data ? 'taken' : 'available');
    }, 450);
    return () => clearTimeout(timer);
  }, [username]);

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setNotice('');
    if (!fullName || !username || !email || !password || !confirmPassword) { setError('Please fill in all fields.'); return; }
    if (!/^[a-zA-Z0-9_.]{3,20}$/.test(username)) { setError('Username should be 3-20 characters: letters, numbers, "_" or "." only.'); return; }
    if (usernameStatus === 'taken') { setError('That username is already taken. Please choose another.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setBusy(true);
    const { data: taken, error: checkErr } = await supabase.rpc('is_username_taken', { uname: username.trim() });
    if (checkErr) { setBusy(false); setError('Could not verify username right now. Please try again.'); return; }
    if (taken) { setBusy(false); setUsernameStatus('taken'); setError('That username is already taken. Please choose another.'); return; }
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;
    const { data, error: signUpErr } = await supabase.auth.signUp({
      email, password,
      options: { data: { username: username.trim(), full_name: fullName.trim(), currency: 'PKR' }, ...(redirectTo ? { emailRedirectTo: redirectTo } : {}) },
    });
    setBusy(false);
    if (signUpErr) { setError(signUpErr.message); return; }
    if (!data.session) setNotice('Signup successful! Please check your email to verify your account before signing in.');
    else setNotice('Signup successful! You are now signed in.');
  }

  const status = usernameStatus === 'available' ? '✓' : usernameStatus === 'taken' ? '✗' : usernameStatus === 'checking' ? '…' : '';
  return (
    <main style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <form onSubmit={handleSubmit} className="card" style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><Image src="/logo.png" alt="Sultan Pocket" width={64} height={64} priority style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 16 }} /></div>
        <h1 style={{ fontSize: 19, fontWeight: 700, marginBottom: 4, textAlign: 'center' }}>Create your account</h1>
        <p style={{ fontSize: 13, color: 'var(--text-faint)', textAlign: 'center', marginBottom: 20 }}>Join Sultan Pocket, it's free</p>
        <GoogleSignInButton />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0', color: 'var(--text-faint)', fontSize: 12 }}><span style={{ flex: 1, height: 1, background: 'var(--border)' }} /><span>or</span><span style={{ flex: 1, height: 1, background: 'var(--border)' }} /></div>
        {error && <div className="form-error" style={{ display: 'block' }}>{error}</div>}
        <div className="field"><label>Full name</label><input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your complete name" /></div>
        <div className="field"><label>Username</label><div style={{ position: 'relative' }}><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Pick a unique username" style={{ paddingRight: 34 }} />{status && <span aria-label="Username availability" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: usernameStatus === 'taken' ? 'var(--danger, #d33)' : 'var(--signal)', fontWeight: 700 }}>{status}</span>}</div></div>
        <div className="field"><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" /></div>
        <PasswordField label="Password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
        <PasswordField label="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" />
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
        {notice && <p className="form-notice" style={{ display: 'block' }}>{notice} <a href="https://mail.google.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--signal)', fontWeight: 600 }}>Open Gmail →</a></p>}
        <p style={{ fontSize: 12.5, color: 'var(--text-faint)', textAlign: 'center', marginTop: 14 }}>Already have an account? <a href="/signin" style={{ color: 'var(--signal)', fontWeight: 600 }}>Sign in</a></p>
      </form>
    </main>
  );
}

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function SignInPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!identifier || !password) {
      setError('Please enter your username/email and password.');
      return;
    }
    setBusy(true);
    let email = identifier;
    if (!identifier.includes('@')) {
      const { data: resolvedEmail, error: lookupErr } = await supabase.rpc('get_email_for_username', { uname: identifier });
      if (lookupErr || !resolvedEmail) {
        setBusy(false);
        setError('No account found with that username.');
        return;
      }
      email = resolvedEmail;
    }
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (signInErr) {
      setError(signInErr.message);
      return;
    }
    router.push('/dashboard');
  }

  return (
    <main style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <form onSubmit={handleSubmit} className="card" style={{ width: '100%', maxWidth: 380 }}>
        <h1 style={{ fontSize: 19, fontWeight: 700, marginBottom: 4, textAlign: 'center' }}>Welcome back</h1>
        <p style={{ fontSize: 13, color: 'var(--text-faint)', textAlign: 'center', marginBottom: 20 }}>Sign in to Sultan Pocket</p>
        {error && <div className="form-error" style={{ display: 'block' }}>{error}</div>}
        <div className="field">
          <label>Username or email</label>
          <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="yourname or you@email.com" />
        </div>
        <div className="field">
          <label>Password</label>
          <div style={{ position: 'relative' }}>
            <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} style={{ paddingRight: 38 }} />
            <button type="button" aria-label={showPw ? 'Hide password' : 'Show password'} onClick={() => setShowPw((s) => !s)} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-faint)', fontSize: 14 }}>
              {showPw ? '🙈' : '👁'}
            </button>
          </div>
        </div>
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <p style={{fontSize:12.5,textAlign:'right',marginTop:8}}><Link href="/forgot-password" style={{color:'var(--signal)',fontWeight:600}}>Forgot password?</Link></p>
        <p style={{ fontSize: 12.5, color: 'var(--text-faint)', textAlign: 'center', marginTop: 14 }}>
          Don't have an account? <a href="/signup" style={{ color: 'var(--signal)', fontWeight: 600 }}>Sign up</a>
        </p>
      </form>
    </main>
  );
}

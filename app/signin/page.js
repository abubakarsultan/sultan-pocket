'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import GoogleSignInButton from '@/components/GoogleSignInButton';

function PasswordField({ label, id, value, onChange, placeholder, autoComplete }) {
  const [show, setShow] = useState(false);

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          style={{ paddingRight: 42 }}
        />
        <button
          type="button"
          aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          onClick={() => setShow((current) => !current)}
          style={{
            position: 'absolute',
            right: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 0,
            color: 'var(--text-faint)',
            fontSize: 14,
            padding: 6,
          }}
        >
          {show ? '🙈' : '👁'}
        </button>
      </div>
    </div>
  );
}

function BackButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: 0,
        background: 'transparent',
        padding: 0,
        color: 'var(--signal)',
        fontSize: 13,
        cursor: 'pointer',
        marginBottom: 14,
      }}
    >
      ← Back
    </button>
  );
}

export default function SignInPage() {
  const router = useRouter();
  const identifierRef = useRef(null);
  const passwordRef = useRef(null);
  const firstNameRef = useRef(null);

  const [step, setStep] = useState('identifier');
  const [identifier, setIdentifier] = useState('');
  const [resolvedEmail, setResolvedEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (step === 'identifier') identifierRef.current?.focus();
    if (step === 'password') passwordRef.current?.focus();
    if (step === 'signup') firstNameRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (step !== 'signup') return undefined;

    const value = username.trim();
    if (!value) {
      setUsernameStatus('');
      return undefined;
    }

    if (!/^[a-zA-Z0-9_.]{3,20}$/.test(value)) {
      setUsernameStatus('invalid');
      return undefined;
    }

    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      const { data, error: rpcError } = await supabase.rpc('is_username_taken', {
        uname: value,
      });
      setUsernameStatus(rpcError ? 'error' : data ? 'taken' : 'available');
    }, 450);

    return () => clearTimeout(timer);
  }, [username, step]);

  function backToIdentifier() {
    setStep('identifier');
    setError('');
    setNotice('');
    setPassword('');
    setConfirmPassword('');
    setResolvedEmail('');
  }

  async function handleIdentifier(event) {
    event.preventDefault();
    setError('');
    setNotice('');

    const value = identifier.trim();
    if (!value) {
      setError('Enter your email or username.');
      return;
    }

    setBusy(true);
    const { data, error: rpcError } = await supabase.rpc('resolve_auth_identifier', {
      identifier: value,
    });

    if (rpcError || !data) {
      setBusy(false);
      setError('We could not check that identifier right now. Please try again.');
      return;
    }

    if (data.registered) {
      if (data.kind === 'username') {
        const { data: email, error: lookupError } = await supabase.rpc(
          'get_email_for_username',
          { uname: value },
        );

        if (lookupError || !email) {
          setBusy(false);
          setError('We could not resolve that username. Please try again.');
          return;
        }

        setResolvedEmail(email);
      } else {
        setResolvedEmail(value);
      }

      setStep('password');
    } else if (data.kind === 'email') {
      setFirstName('');
      setLastName('');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setUsernameStatus('');
      setStep('signup');
    } else {
      setStep('unregistered-username');
    }

    setBusy(false);
  }

  async function handlePassword(event) {
    event.preventDefault();
    setError('');

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setBusy(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: resolvedEmail,
      password,
    });
    setBusy(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push('/dashboard');
  }

  async function handleSignup(event) {
    event.preventDefault();
    setError('');
    setNotice('');

    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanUsername = username.trim();
    const cleanEmail = identifier.trim();

    if (!cleanFirstName || !cleanLastName || !cleanUsername || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (!/^[a-zA-Z0-9_.]{3,20}$/.test(cleanUsername)) {
      setError('Username should be 3-20 characters: letters, numbers, _ or . only.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);

    const { data: taken, error: checkError } = await supabase.rpc('is_username_taken', {
      uname: cleanUsername,
    });

    if (checkError) {
      setBusy(false);
      setError('Could not verify username right now. Please try again.');
      return;
    }

    if (taken) {
      setBusy(false);
      setUsernameStatus('taken');
      setError('That username is already taken.');
      return;
    }

    const fullName = `${cleanFirstName} ${cleanLastName}`.trim();
    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : undefined;

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          username: cleanUsername,
          full_name: fullName,
          first_name: cleanFirstName,
          last_name: cleanLastName,
          currency: 'PKR',
        },
        ...(redirectTo ? { emailRedirectTo: redirectTo } : {}),
      },
    });

    setBusy(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (!data.session) {
      setNotice('Account created. Please check your email to verify your account before signing in.');
    } else {
      router.push('/dashboard');
    }
  }

  const statusIcon = usernameStatus === 'available'
    ? '✓'
    : usernameStatus === 'taken'
      ? '✗'
      : usernameStatus === 'checking'
        ? '…'
        : '';

  return (
    <main
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <section
        className="card auth-form-stagger"
        style={{ width: '100%', maxWidth: 400 }}
        aria-live="polite"
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <Image
            src="/logo.png"
            alt="Sultan Pocket"
            width={64}
            height={64}
            priority
            style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 16 }}
          />
        </div>

        {step === 'identifier' ? (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 6 }}>
              Log in or sign up
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-faint)', textAlign: 'center', marginBottom: 20 }}>
              Enter your email or username to continue
            </p>

            <GoogleSignInButton />

            <div
              aria-hidden="true"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                margin: '16px 0',
                color: 'var(--text-faint)',
                fontSize: 12,
              }}
            >
              <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span>or</span>
              <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            {error ? (
              <div className="form-error" style={{ display: 'block' }} role="alert">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleIdentifier}>
              <div className="field">
                <label htmlFor="auth-identifier">Email or username</label>
                <input
                  ref={identifierRef}
                  id="auth-identifier"
                  type="text"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="you@email.com or username"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck="false"
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
                {busy ? 'Checking…' : 'Continue'}
              </button>
            </form>
          </div>
        ) : null}

        {step === 'password' ? (
          <form onSubmit={handlePassword}>
            <BackButton onClick={backToIdentifier} />
            <h1 style={{ fontSize: 21, fontWeight: 700, marginBottom: 6 }}>Welcome back</h1>
            <p style={{ fontSize: 13, color: 'var(--text-faint)', marginBottom: 20 }}>
              Signing in as <strong style={{ color: 'var(--text)' }}>{identifier}</strong>
            </p>

            {error ? (
              <div className="form-error" style={{ display: 'block' }} role="alert">
                {error}
              </div>
            ) : null}

            <div className="field">
              <label htmlFor="auth-password">Password</label>
              <input
                ref={passwordRef}
                id="auth-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
              {busy ? 'Signing in…' : 'Log in'}
            </button>
            <p style={{ fontSize: 12.5, textAlign: 'right', marginTop: 8 }}>
              <Link href="/forgot-password" style={{ color: 'var(--signal)', fontWeight: 600 }}>
                Forgot password?
              </Link>
            </p>
          </form>
        ) : null}

        {step === 'signup' ? (
          <form onSubmit={handleSignup}>
            <BackButton onClick={backToIdentifier} />
            <h1 style={{ fontSize: 21, fontWeight: 700, marginBottom: 6 }}>Create your account</h1>
            <p style={{ fontSize: 13, color: 'var(--text-faint)', marginBottom: 18 }}>
              No account was found for <strong style={{ color: 'var(--text)' }}>{identifier}</strong>.
            </p>

            {error ? (
              <div className="form-error" style={{ display: 'block' }} role="alert">
                {error}
              </div>
            ) : null}
            {notice ? (
              <div className="form-notice" style={{ display: 'block' }} role="status">
                {notice}
              </div>
            ) : null}

            <div className="field">
              <label htmlFor="first-name">First name</label>
              <input
                ref={firstNameRef}
                id="first-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                autoComplete="given-name"
              />
            </div>

            <div className="field">
              <label htmlFor="last-name">Last name</label>
              <input
                id="last-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                autoComplete="family-name"
              />
            </div>

            <div className="field">
              <label htmlFor="new-username">Username</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="new-username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Pick a unique username"
                  style={{ paddingRight: 34 }}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck="false"
                  aria-describedby="username-status"
                />
                {statusIcon ? (
                  <span
                    id="username-status"
                    aria-label={`Username ${usernameStatus}`}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: usernameStatus === 'taken' ? 'var(--danger)' : 'var(--signal)',
                      fontWeight: 700,
                    }}
                  >
                    {statusIcon}
                  </span>
                ) : null}
              </div>
            </div>

            <PasswordField
              label="Password"
              id="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
            />
            <PasswordField
              label="Re-type password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Enter it again"
              autoComplete="new-password"
            />

            <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
              {busy ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        ) : null}

        {step === 'unregistered-username' ? (
          <div>
            <BackButton onClick={backToIdentifier} />
            <h1 style={{ fontSize: 21, fontWeight: 700, marginBottom: 8 }}>Username not registered</h1>
            <p style={{ fontSize: 13, color: 'var(--text-faint)', lineHeight: 1.6, marginBottom: 20 }}>
              <strong style={{ color: 'var(--text)' }}>@{identifier}</strong> isn’t registered. Please use your email address to create a new Sultan Pocket account.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => {
                setIdentifier('');
                setStep('identifier');
              }}
            >
              Use my email
            </button>
          </div>
        ) : null}

        <p style={{ fontSize: 12.5, color: 'var(--text-faint)', textAlign: 'center', marginTop: 16 }}>
          Securely manage your Sultan Pocket account.
        </p>
      </section>
    </main>
  );
}

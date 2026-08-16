'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const MAX = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

function suggestedUsername(metadata, email) {
  const source = metadata.full_name || email?.split('@')[0] || 'user';
  const base = source.toLowerCase().replace(/[^a-z0-9_.]+/g, '').slice(0, 16) || 'user';
  return base.length >= 3 ? base : `${base}user`;
}

function getAge(dob) {
  const birth = new Date(`${dob}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const month = today.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
}

export default function OnboardingPage() {
  const router = useRouter();
  const inputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [currency, setCurrency] = useState('PKR');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data, error: e }) => {
      if (!active) return;
      if (e || !data.user) { router.replace('/signin'); return; }
      const u = data.user;
      const m = u.user_metadata || {};
      setUser(u);
      setName(m.full_name || m.username || '');
      setUsername(m.username || suggestedUsername(m, u.email));
      setDateOfBirth(m.date_of_birth || '');
      setCurrency(m.currency || 'PKR');
      setLoading(false);
    });
    return () => { active = false; };
  }, [router]);

  const needsUsername = !user?.user_metadata?.username;

  useEffect(() => {
    if (!needsUsername) { setUsernameStatus(''); return; }
    const value = username.trim();
    if (!value) { setUsernameStatus(''); return; }
    if (!/^[a-zA-Z0-9_.]{3,20}$/.test(value)) { setUsernameStatus('invalid'); return; }
    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      const { data, error: e } = await supabase.rpc('is_username_taken', { uname: value });
      setUsernameStatus(e ? 'error' : data ? 'taken' : 'available');
    }, 450);
    return () => clearTimeout(timer);
  }, [username, needsUsername]);

  useEffect(() => () => {
    if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
  }, [preview]);

  function chooseFile(e) {
    const f = e.target.files?.[0];
    setError('');
    if (!f) return;
    if (!ALLOWED.includes(f.type)) { setError('Please choose a JPG, PNG, or WEBP image.'); e.target.value = ''; return; }
    if (f.size > MAX) { setError('Profile picture must be 5MB or smaller.'); e.target.value = ''; return; }
    if (preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    setFile(f); setPreview(URL.createObjectURL(f));
  }

  function removePicture() {
    setFile(null);
    if (preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    setPreview('');
    if (inputRef.current) inputRef.current.value = '';
  }

  async function save() {
    if (!user) return;
    setBusy(true); setError('');
    let uploadedPath = '';
    try {
      if (needsUsername) {
        if (!/^[a-zA-Z0-9_.]{3,20}$/.test(username.trim())) throw new Error('Username should be 3-20 characters: letters, numbers, "_" or "." only.');
        if (usernameStatus === 'taken') throw new Error('That username is already taken. Please choose another.');
        const { data: taken, error: e } = await supabase.rpc('is_username_taken', { uname: username.trim() });
        if (e) throw e;
        if (taken) { setUsernameStatus('taken'); throw new Error('That username is already taken. Please choose another.'); }
      }

      if (!dateOfBirth) throw new Error('Please enter your date of birth.');
      const birth = new Date(`${dateOfBirth}T00:00:00`);
      if (Number.isNaN(birth.getTime()) || getAge(dateOfBirth) < 13) throw new Error('You must be at least 13 years old to use Sultan Pocket.');

      let avatarUrl = user.user_metadata?.avatar_url || '';
      let avatarPath = user.user_metadata?.avatar_path || '';
      if (file) {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        uploadedPath = `${user.id}/avatar-${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(uploadedPath, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('avatars').getPublicUrl(uploadedPath);
        avatarUrl = data.publicUrl;
        avatarPath = uploadedPath;
      }

      const metadata = {
        full_name: name.trim(),
        currency,
        date_of_birth: dateOfBirth,
        avatar_url: avatarUrl,
        avatar_path: avatarPath,
        ...(needsUsername ? { username: username.trim() } : {}),
      };
      const { error: updateError } = await supabase.auth.updateUser({ data: metadata });
      if (updateError) throw updateError;
      const oldPath = user.user_metadata?.avatar_path;
      if (oldPath && oldPath !== avatarPath) await supabase.storage.from('avatars').remove([oldPath]);
      router.replace('/dashboard');
    } catch (e) {
      if (uploadedPath) await supabase.storage.from('avatars').remove([uploadedPath]);
      setError(e.message || 'Could not save your profile.');
      setBusy(false);
    }
  }

  if (loading) return <main className="onboarding-page"><section className="onboarding-card onboarding-stagger"><p>Loading…</p></section></main>;

  const display = preview || user?.user_metadata?.avatar_url || '';
  const initial = String(name || user?.email || 'U').charAt(0).toUpperCase();
  const status = usernameStatus === 'available' ? '✓' : usernameStatus === 'taken' ? '✗' : usernameStatus === 'checking' ? '…' : '';

  return <main className="onboarding-page">
    <section className="onboarding-card onboarding-stagger">
      <div className="onboarding-success">✓</div>
      <span className="section-label">ACCOUNT SETUP</span>
      <h1>Welcome to Sultan Pocket</h1>
      <p className="onboarding-lead">Your account is ready. Let’s personalize your profile before you start.</p>

      {error && <div className="profile-notice error" style={{ margin: '0 0 18px' }}>{error}</div>}

      <div className="onboarding-avatar-wrap">
        <div className="onboarding-avatar">{display ? <img src={display} alt="Profile preview" /> : initial}</div>
        <button type="button" className="onboarding-avatar-edit" onClick={() => inputRef.current?.click()} aria-label="Change profile picture">✎</button>
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseFile} hidden />
      <div className="onboarding-avatar-help">JPG, PNG or WEBP · max 5MB.</div>
      {file && <button type="button" className="onboarding-remove" onClick={removePicture}>Remove new picture</button>}

      {needsUsername && <div className="onboarding-field field">
        <label>Username</label>
        <div style={{ position: 'relative' }}>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Choose a unique username" style={{ paddingRight: 36 }} />
          {status && <span aria-label="Username availability" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: usernameStatus === 'taken' ? 'var(--danger, #d33)' : 'var(--signal)', fontWeight: 700 }}>{status}</span>}
        </div>
      </div>}

      <div className="onboarding-field field"><label>Date of birth</label><input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} /></div>
      <div className="onboarding-field field"><label>What currency should Sultan Pocket use?</label><select value={currency} onChange={(e) => setCurrency(e.target.value)}><option value="PKR">PKR — Pakistani Rupee</option><option value="USD">USD — US Dollar</option><option value="GBP">GBP — British Pound</option><option value="EUR">EUR — Euro</option></select></div>

      <button className="btn btn-primary btn-block onboarding-continue" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Continue to Dashboard →'}</button>
      <button className="onboarding-skip" onClick={() => router.replace('/dashboard')} disabled={busy}>Skip for now</button>
    </section>
  </main>;
}

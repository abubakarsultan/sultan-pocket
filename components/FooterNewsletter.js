'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function FooterNewsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setStatus('Please enter a valid email address.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.from('newsletter_signups').insert({ email: value });
    setBusy(false);
    if (error && error.code !== '23505') {
      setStatus('Could not subscribe right now. Please try again.');
      return;
    }
    setEmail('');
    setStatus("Thanks — you're on the list!");
  }

  return (
    <div className="footer-newsletter">
      <div>
        <h3>Stay in the loop</h3>
        <p>Occasional product updates and practical money tips.</p>
      </div>
      <form onSubmit={submit} className="footer-newsletter-form">
        <input type="email" value={email} onChange={e => { setEmail(e.target.value); setStatus(''); }} placeholder="Your email address" aria-label="Email address" required />
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Joining…' : 'Subscribe'}</button>
      </form>
      {status && <small className={status.startsWith('Thanks') ? 'success' : 'error'} role="status">{status}</small>}
    </div>
  );
}

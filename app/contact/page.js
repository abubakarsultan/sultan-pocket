'use client';
import { useState } from 'react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('sending');
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send message.');
      setStatus('sent');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  }

  return <main>
    <section className="page-hero"><div className="container narrow"><span className="section-label">GET IN TOUCH</span><h1>We'd love to hear from you.</h1><p>Have a question, found an issue, or have an idea for Sultan Pocket? Send us a message.</p></div></section>
    <section className="section-block"><div className="container contact-grid"><div><h2>Contact Sultan Pocket</h2><p>For product questions, feedback, or feature suggestions, use the form. We will keep improving the experience around the things that matter most to personal money management.</p><div className="contact-points"><div><span>💬</span><strong>Product feedback</strong><small>Tell us what would make your wallet easier to use.</small></div><div><span>🐞</span><strong>Bug reports</strong><small>Include the page and steps that caused the issue.</small></div><div><span>💡</span><strong>Feature ideas</strong><small>Share the money-management feature you want next.</small></div></div></div>
      <form className="contact-form card" onSubmit={handleSubmit}>
        {status === 'sent' && <div className="form-notice" style={{ display: 'block', marginBottom: 12 }}>Thanks! Your message has been sent — we'll get back to you soon.</div>}
        {status === 'error' && <div className="form-error" style={{ display: 'block', marginBottom: 12 }}>{error}</div>}
        <div className="form-row">
          <div className="field"><label htmlFor="contact-name">Name</label><input id="contact-name" required placeholder="Your name" value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
          <div className="field"><label htmlFor="contact-email">Email</label><input id="contact-email" type="email" required placeholder="you@email.com" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
        </div>
        <div className="field"><label htmlFor="contact-subject">Subject</label><input id="contact-subject" required placeholder="How can we help?" value={form.subject} onChange={(e) => set('subject', e.target.value)} /></div>
        <div className="field"><label htmlFor="contact-message">Message</label><textarea id="contact-message" required placeholder="Write your message..." value={form.message} onChange={(e) => set('message', e.target.value)} /></div>
        <button className="btn btn-primary" type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : 'Send message →'}</button>
      </form>
    </div></section>
  </main>;
}

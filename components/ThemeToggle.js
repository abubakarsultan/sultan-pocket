'use client';
import { useEffect, useState } from 'react';

function getResolved(pref) {
  if (typeof window === 'undefined') return 'light';
  return pref === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : pref;
}

export default function ThemeToggle() {
  const [resolved, setResolved] = useState('light');
  useEffect(() => {
    const sync = () => setResolved(getResolved(localStorage.getItem('sultan-pocket-theme') || 'system'));
    sync();
    window.addEventListener('sultan-pocket-theme-change', sync);
    return () => window.removeEventListener('sultan-pocket-theme-change', sync);
  }, []);
  function toggle() {
    const next = resolved === 'dark' ? 'light' : 'dark';
    localStorage.setItem('sultan-pocket-theme', next);
    window.dispatchEvent(new Event('sultan-pocket-theme-change'));
  }
  const dark = resolved === 'dark';
  return <button type="button" role="switch" aria-checked={dark} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} className={`theme-toggle-switch${dark ? ' is-dark' : ''}`} onClick={toggle}>
    <span className="theme-toggle-track"><span className="theme-toggle-thumb">
      <svg className={dark ? 'is-hidden' : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2.4M12 19.1v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7"/></svg>
      <svg className={!dark ? 'is-hidden' : ''} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.5 14.7A8.5 8.5 0 1 1 9.3 3.5a7 7 0 0 0 11.2 11.2Z"/></svg>
    </span></span>
  </button>;
}

'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import ProfileMenu from './ProfileMenu';
import ThemeToggle from './ThemeToggle';

const LINKS = [
  ['/', 'Home'], ['/services', 'Features'], ['/about', 'About'], ['/blog', 'Blog'], ['/faq', 'FAQ'], ['/contact', 'Contact'],
];

export default function Navbar() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', close);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', close); document.body.style.overflow = ''; };
  }, [open]);

  return (
    <header className="site-navbar">
      <div className="container site-navbar-inner">
        <Link href="/" className="site-brand" onClick={() => setOpen(false)}>
          <Image src="/logo.png" alt="Sultan Pocket" width={34} height={34} priority />
          <span>Sultan Pocket</span>
        </Link>
        <nav aria-label="Primary navigation" className="nav-links">
          {LINKS.map(([href, label]) => <Link key={href} href={href} prefetch={false}>{label}</Link>)}
        </nav>
        <div className="site-navbar-actions">
          <ThemeToggle />
          {loading ? null : user ? (
            <><Link href="/dashboard" className="btn btn-ghost desktop-auth-link">Dashboard</Link><ProfileMenu compact /></>
          ) : (
            <><Link href="/signin" className="btn btn-ghost desktop-auth-link">Sign in</Link><Link href="/signup" className="btn btn-primary desktop-auth-link">Sign up</Link></>
          )}
          <button type="button" className="mobile-menu-btn" aria-label={open ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={open} onClick={() => setOpen(v => !v)}>
            <span /><span /><span />
          </button>
        </div>
      </div>
      {open && <div className="mobile-nav-panel">
        <nav aria-label="Mobile navigation">
          {LINKS.map(([href, label]) => <Link key={href} href={href} prefetch={false} onClick={() => setOpen(false)}>{label}<span>→</span></Link>)}
          {loading ? null : user ? <Link href="/dashboard" onClick={() => setOpen(false)}>Dashboard<span>→</span></Link> : <>
            <Link href="/signin" onClick={() => setOpen(false)}>Sign in<span>→</span></Link>
            <Link href="/signup" className="mobile-nav-primary" onClick={() => setOpen(false)}>Sign up<span>→</span></Link>
          </>}
        </nav>
      </div>}
    </header>
  );
}

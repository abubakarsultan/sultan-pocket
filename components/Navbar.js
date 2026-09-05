'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import ProfileMenu from './ProfileMenu';
import ThemeToggle from './ThemeToggle';
import { supabase } from '@/lib/supabaseClient';
import { useStandalone } from '@/lib/useStandalone';

const LINKS = [
  ['/', 'Home'], ['/services', 'Features'], ['/about', 'About'], ['/blog', 'Blog'], ['/faq', 'FAQ'], ['/contact', 'Contact'],
];

export default function Navbar() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const standalone = useStandalone();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', close);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', close); document.body.style.overflow = previous; };
  }, [open]);

  const isActive = (href) => href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  if (standalone) return null;

  async function signOut() {
    setOpen(false);
    await supabase.auth.signOut();
  }

  const meta = user?.user_metadata || {};
  const username = meta.username || user?.email?.split('@')[0] || 'user';
  const fullName = meta.full_name || username;
  const avatar = meta.avatar_url;
  const initials = String(fullName).split(/\s+/).filter(Boolean).slice(0, 2).map(x => x.charAt(0).toUpperCase()).join('') || 'U';
  const profileUrl = `/u/${encodeURIComponent(username)}`;
  const editUrl = `${profileUrl}?edit=1`;

  return (
    <header className={`site-navbar${scrolled ? ' is-scrolled' : ''}`}>
      <div className="container site-navbar-inner">
        <Link href="/" className="site-brand" onClick={() => setOpen(false)}>
          <Image src="/logo.png" alt="Sultan Pocket" width={34} height={34} priority />
          <span>Sultan Pocket</span>
        </Link>
        <nav aria-label="Primary navigation" className="nav-links">
          {LINKS.map(([href, label]) => <Link key={href} href={href} prefetch={false} className={isActive(href) ? 'active' : ''}>{label}</Link>)}
        </nav>
        <div className="site-navbar-actions">
          <ThemeToggle />
          {loading ? null : user ? (
            <>
              <Link href="/dashboard" className="btn btn-ghost desktop-auth-link">Dashboard</Link>
              <ProfileMenu compact />
              <Link href="/dashboard" className="btn btn-primary mobile-direct-auth">Dashboard</Link>
            </>
          ) : (
            <>
              <Link href="/signin" className="btn btn-ghost desktop-auth-link">Sign in</Link>
              <Link href="/signup" className="btn btn-primary desktop-auth-link">Sign up</Link>
              <Link href="/signin" className="btn btn-ghost mobile-direct-auth">Log in</Link>
            </>
          )}
          <button type="button" className={`mobile-menu-btn${open ? ' is-open' : ''}`} aria-label={open ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={open} onClick={() => setOpen(v => !v)}>
            <span /><span /><span />
          </button>
        </div>
      </div>

      {open && <div className="mobile-nav-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false); }} aria-hidden="true" />}
      <aside className={`mobile-nav-panel${open ? ' is-open' : ''}`} aria-label="Mobile navigation" aria-hidden={!open} inert={!open}>
        <div className="mobile-nav-head"><strong>Menu</strong><button type="button" onClick={() => setOpen(false)} aria-label="Close menu">×</button></div>
        <nav className="mobile-nav-primary-list">
          {LINKS.map(([href, label]) => <Link key={href} href={href} prefetch={false} className={isActive(href) ? 'active' : ''} onClick={() => setOpen(false)}>{label}<span>→</span></Link>)}
        </nav>
        <div className="mobile-account-section">
          <div className="mobile-account-heading">ACCOUNT</div>
          {loading ? null : user ? <>
            <div className="mobile-account-user">
              <span className="profile-avatar profile-avatar-lg">{avatar ? <img src={avatar} alt="" /> : initials}</span>
              <div><strong>{fullName}</strong><span>Free plan</span></div>
            </div>
            <div className="mobile-account-links">
              <Link href={editUrl} onClick={() => setOpen(false)}>Personalization <span>→</span></Link>
              <Link href={profileUrl} onClick={() => setOpen(false)}>Profile <span>→</span></Link>
              <Link href="/dashboard/security" onClick={() => setOpen(false)}>Settings &amp; Security <span>→</span></Link>
              <Link href="/faq" onClick={() => setOpen(false)}>Help <span>→</span></Link>
              <button type="button" onClick={signOut}>Log out <span>↪</span></button>
            </div>
          </> : <div className="mobile-auth-actions"><Link href="/signin" className="btn btn-ghost" onClick={() => setOpen(false)}>Sign in</Link><Link href="/signup" className="btn btn-primary" onClick={() => setOpen(false)}>Sign up</Link></div>}
          <div className="mobile-theme-row"><span>Appearance</span><ThemeToggle /></div>
        </div>
      </aside>
    </header>
  );
}

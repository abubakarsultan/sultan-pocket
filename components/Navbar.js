'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from './AuthProvider';
import ProfileMenu from './ProfileMenu';
import { supabase } from '@/lib/supabaseClient';

export default function Navbar() {
  const { user, loading } = useAuth();

  return (
    <header style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 50 }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Image
            src="/logo.png"
            alt="Sultan Pocket"
            width={34}
            height={34}
            priority
            style={{ width: 34, height: 34, objectFit: 'contain', borderRadius: 9 }}
          />
          <span style={{ fontWeight: 600, fontSize: 15 }}>Sultan Pocket</span>
        </Link>
        <nav aria-label="Primary navigation" style={{ display: 'flex', gap: 22, fontSize: 13.5, color: 'var(--text-dim)' }} className="nav-links">
          <Link href="/">Home</Link>
          <Link href="/services">Services</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <div style={{ display: 'flex', gap: 8 }}>
          {loading ? null : user ? (
            <>
              <Link href="/dashboard" className="btn btn-ghost">Dashboard</Link>
              <ProfileMenu compact />
            </>
          ) : (
            <>
              <Link href="/signin" className="btn btn-ghost">Sign in</Link>
              <Link href="/signup" className="btn btn-primary">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

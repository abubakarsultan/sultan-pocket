import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', marginTop: 60 }}>
      <div className="container" style={{ padding: '28px 24px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>© {new Date().getFullYear()} Sultan Pocket. All rights reserved.</span>
          <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>Created by Abubakar Sultan</span>
        </div>
        <nav aria-label="Footer navigation" style={{ display: 'flex', gap: 18, fontSize: 13, color: 'var(--text-dim)' }}>
          <Link href="/services" prefetch={false}>Features</Link>
          <Link href="/about" prefetch={false}>About</Link>
          <Link href="/blog" prefetch={false}>Blog</Link>
          <Link href="/faq" prefetch={false}>FAQ</Link>
          <Link href="/contact" prefetch={false}>Contact</Link>
          <Link href="/privacy" prefetch={false}>Privacy</Link>
          <Link href="/terms" prefetch={false}>Terms</Link>
        </nav>
      </div>
    </footer>
  );
}

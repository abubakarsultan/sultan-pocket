import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', marginTop: 60 }}>
      <div className="container" style={{ padding: '28px 24px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>© {new Date().getFullYear()} Sultan Pocket</span>
        <nav aria-label="Footer navigation" style={{ display: 'flex', gap: 18, fontSize: 13, color: 'var(--text-dim)' }}>
          <Link href="/services">Features</Link>
          <Link href="/about">About</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}

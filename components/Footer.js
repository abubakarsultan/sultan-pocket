import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import NewsletterSignup from './NewsletterSignup';
import AssistantFooterButton from './AssistantFooterButton';

export default async function Footer() {
  let social = {};
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { data } = await supabase.from('site_settings').select('instagram_url,facebook_url,x_url,linkedin_url').eq('id',1).maybeSingle();
    social = data || {};
  } catch {}
  const socials = [['Instagram',social.instagram_url],['Facebook',social.facebook_url],['X',social.x_url],['LinkedIn',social.linkedin_url]].filter(([,url])=>url);
  return <footer className="site-footer">
    <div className="container footer-grid">
      <div className="footer-brand-col"><Link href="/" className="footer-brand"><Image src="/logo.png" alt="Sultan Pocket" width={36} height={36} /><strong>Sultan Pocket</strong></Link><p>Personal finance, made simple. Track your money, understand your spending, and keep your wallet organized.</p><div className={`footer-socials${socials.length ? '' : ' is-empty'}`} aria-label="Social media">{socials.length ? socials.map(([label,url])=><a key={label} href={url} target="_blank" rel="noreferrer" aria-label={label}>{label}</a>) : <span className="footer-social-placeholder">Social links coming soon.</span>}</div><AssistantFooterButton /></div>
      <NewsletterSignup />
      <div className="footer-col"><h3>Product</h3><Link href="/services">Features</Link><Link href="/blog">Blog</Link><Link href="/faq">FAQ</Link></div>
      <div className="footer-col"><h3>Company</h3><Link href="/about">About</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
      <div className="footer-col"><h3>Get started</h3><Link href="/signup">Create account</Link><Link href="/signin">Sign in</Link><Link href="/expense-tracker">Open wallet</Link></div>
    </div>
    <div className="container footer-bottom"><span>© {new Date().getFullYear()} Sultan Pocket. All rights reserved.</span><span>Created by Abubakar Sultan</span></div>
  </footer>;
}

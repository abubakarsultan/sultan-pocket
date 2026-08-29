import Link from 'next/link';
import Image from 'next/image';
import ScrollReveal from '@/components/ScrollReveal';
import { getPageSeo, buildPageMetadata } from '@/lib/pageSeo';
import { BentoFeatures, HeroPreview, Reveal, HowItWorks } from '@/components/home/LandingAnimations';

export const revalidate = 60;
export async function generateMetadata() { return buildPageMetadata(await getPageSeo('/', { title: 'Sultan Pocket — Manage your money, your way.', description: 'Sultan Pocket helps you track expenses, plan budgets, and grow savings — all your personal finance tools in one place.' })); }

const FEATURES = [
  { icon: '💳', title: 'Expense tracking', desc: 'Record everyday spending across cash, online payments, and transport in one organized wallet.', href: '/expense-tracker' },
  { icon: '💰', title: 'Income tracking', desc: 'Keep your salary and other income visible so you always know where your money comes from.', href: '/expense-tracker' },
  { icon: '🎯', title: 'Savings goals', desc: 'Move money into savings and track how much you have set aside over time.', href: '/services' },
  { icon: '📊', title: 'Clear insights', desc: 'Understand your spending with monthly summaries, categories, balances, and wallet activity.', href: '/expense-tracker' },
  { icon: '🔄', title: 'Easy transfers', desc: 'Move money between Cash and Online without creating unnecessary income or expense entries.', href: '/services' },
  { icon: '🛡️', title: 'Your personal wallet', desc: 'Your account keeps your financial records separate and accessible when you sign in.', href: '/privacy' },
];

const STEPS = [
  ['01', 'Create your account', 'Sign up with your name, username, email, and password.'],
  ['02', 'Record your money', 'Add income, expenses, transfers, savings, borrowing, and repayments.'],
  ['03', 'Understand your month', 'Use your wallet and reports to see where your money is going.'],
];

const FAQS = [
  ['Is Sultan Pocket free?', 'Yes. Sultan Pocket is designed as a simple personal finance tool for managing your own wallet and expenses.'],
  ['Can I track both cash and online money?', 'Yes. The wallet separates Cash and Online balances and supports transfers between them.'],
  ['Can I track savings and borrowed money?', 'Yes. The wallet supports savings, borrowing, repayment, and related balance movements.'],
  ['Is my financial data public?', 'No. Your wallet is tied to your account. Public profile information is separate from private wallet records.'],
];

export default function HomePage() {
  return (
    <main>
      <section className="hero-section">
        <div className="hero-gradient-blobs" aria-hidden="true"><span className="hero-blob hero-blob-one" /><span className="hero-blob hero-blob-two" /><span className="hero-blob hero-blob-three" /></div>
        <div className="container hero-grid">
          <Reveal className="hero-copy">
            <div className="eyebrow"><Image src="/logo.png" alt="" width={28} height={28} /> Personal finance, made simple</div>
            <h1>Manage your money,<br /><span>your way.</span></h1>
            <p>Track expenses, record income, manage savings, and understand your monthly money flow — all from one simple personal wallet.</p>
            <div className="hero-actions"><Link href="/signup" className="btn btn-primary hero-btn">Get started free →</Link><Link href="/expense-tracker" className="btn hero-btn-secondary">Open expense tracker</Link></div>
            <div className="hero-trust"><span>✓ Cash & Online</span><span>✓ Savings</span><span>✓ Monthly tracking</span></div>
          </Reveal>
          <div className="hero-visual" aria-label="Sultan Pocket wallet preview"><HeroPreview /></div>
        </div>
      </section>

      <section className="section-block section-muted problem-section">
        <Reveal>
          <div className="container split-section">
            <div><span className="section-label">THE PROBLEM</span><h2>Know your balance before the month knows you.</h2><p>Money gets difficult to manage when cash, online spending, savings, and everyday purchases live in different places. Sultan Pocket gives every transaction a place so your month is easier to understand.</p></div>
            <div className="benefit-list"><div><b>01</b><span><strong>Separate money clearly</strong><small>Cash, Online, Savings and E-Transit stay easy to understand.</small></span></div><div><b>02</b><span><strong>Record the movement</strong><small>Transfers move balances instead of pretending they are new income or expenses.</small></span></div><div><b>03</b><span><strong>Review your month</strong><small>Use your transaction history and wallet insights to make better decisions.</small></span></div></div>
          </div>
        </Reveal>
      </section>

      <section className="section-block">
        <Reveal>
          <div className="container">
            <div className="section-heading"><span>THE SOLUTION</span><h2>Everything you need for everyday money.</h2><p>Keep your personal finances organized without turning money management into a complicated spreadsheet.</p></div>
            <BentoFeatures features={FEATURES} />
          </div>
        </Reveal>
      </section>

      <section className="section-block section-muted">
        <Reveal>
          <div className="container">
            <div className="section-heading"><span>HOW IT WORKS</span><h2>Simple from day one.</h2><p>Start small, keep your records consistent, and let your wallet tell the story of your money.</p></div>
            <HowItWorks steps={STEPS} />
          </div>
        </Reveal>
      </section>

      <section className="section-block">
        <Reveal>
          <div className="container">
            <div className="section-heading"><span>FAQ</span><h2>Questions, answered.</h2></div>
            <div className="faq-grid">{FAQS.map(([q, a]) => <div className="faq-card" key={q}><h3>{q}</h3><p>{a}</p></div>)}</div>
            <div className="center-link"><Link href="/faq" className="text-cta">View all FAQs →</Link></div>
          </div>
        </Reveal>
      </section>

      <section className="final-cta">
        <Reveal>
          <div className="container"><Image src="/logo.png" alt="Sultan Pocket" width={52} height={52} /><h2>Ready to take control of your wallet?</h2><p>Create your free account and start tracking your money today.</p><Link href="/signup" className="btn btn-primary hero-btn">Create my account →</Link></div>
        </Reveal>
      </section>
    </main>
  );
}

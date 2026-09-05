import Link from 'next/link';
import Image from 'next/image';
import ScrollReveal from '@/components/ScrollReveal';
import AnimatedProductPreview from '@/components/home/AnimatedProductPreview';
import BentoFeatures from '@/components/home/BentoFeatures';
import AnimatedSteps from '@/components/home/AnimatedSteps';
import TryItWidget from '@/components/home/TryItWidget';
import { getPageSeo, buildPageMetadata } from '@/lib/pageSeo';

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
  ['01', 'Sign up free', 'Create your account with a name, username, email, and password — takes about a minute.', '📝'],
  ['02', 'Add your first transaction', 'Record an income, expense, transfer, or savings entry — or just type it in plain language.', '💳'],
  ['03', 'See your money clearly', 'Your dashboard and charts show balances, categories, and trends automatically.', '📊'],
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
      <ScrollReveal as="section" className="hero-section">
        <div className="hero-gradient-blobs" aria-hidden="true"><span className="hero-blob hero-blob-one" /><span className="hero-blob hero-blob-two" /><span className="hero-blob hero-blob-three" /></div>
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow"><Image src="/logo.png" alt="" width={28} height={28} /> Personal finance, made simple</div>
            <h1>Manage your money,<br /><span>your way.</span></h1>
            <p>Track expenses, record income, manage savings, and understand your monthly money flow — all from one simple personal wallet.</p>
            <div className="hero-actions">
              <Link href="/signup" className="btn btn-primary hero-btn">Get started free →</Link>
              <Link href="/expense-tracker" className="btn hero-btn-secondary">Open expense tracker</Link>
            </div>
            <div className="hero-trust"><span>✓ Cash & Online</span><span>✓ Savings</span><span>✓ Monthly tracking</span></div>
            <a href="/downloads/sultan-pocket.apk" download className="btn hero-btn-secondary hero-apk-download">⬇ Download Android APK</a>
          </div>

          <AnimatedProductPreview />
        </div>
      </ScrollReveal>

      <ScrollReveal as="section" className="section-block section-problem">
        <div className="container split-section">
          <div><span className="section-label">THE PROBLEM</span><h2>Money gets confusing when every payment lives somewhere different.</h2><p>Cash in your pocket, money in the bank, savings set aside, transport credit and everyday spending are easy to lose track of when they are scattered across notes and apps.</p></div>
          <div className="before-after">
            <div className="before-after-col before-col"><span className="before-after-label">😵‍💫 THE OLD WAY</span>
              <div><i>📓</i><span>A notebook you forget to update</span></div>
              <div><i>💬</i><span>WhatsApp messages to yourself</span></div>
              <div><i>🧠</i><span>Trying to remember where it went</span></div>
              <div><i>❓</i><span>No real answer for &ldquo;how much do I have?&rdquo;</span></div>
            </div>
            <div className="before-after-arrow" aria-hidden="true">→</div>
            <div className="before-after-col after-col"><span className="before-after-label">✨ WITH SULTAN POCKET</span>
              <div><i>💳</i><span>Every rupee logged in one wallet</span></div>
              <div><i>✦</i><span>Just type it, in your own words</span></div>
              <div><i>📊</i><span>Categories and trends, automatically</span></div>
              <div><i>✓</i><span>Your balance, always up to date</span></div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal as="section" className="section-block">
        <div className="container">
          <div className="section-heading"><span>WHAT YOU CAN DO</span><h2>Everything you need for everyday money.</h2><p>Keep your personal finances organized without turning money management into a complicated spreadsheet.</p></div>
          <BentoFeatures features={FEATURES} />
        </div>
      </ScrollReveal>

      <ScrollReveal as="section" className="section-block section-muted">
        <div className="container">
          <div className="section-heading"><span>HOW IT WORKS</span><h2>Simple from day one.</h2><p>Start small, keep your records consistent, and let your wallet tell the story of your money.</p></div>
          <AnimatedSteps steps={STEPS} />
        </div>
      </ScrollReveal>

      <ScrollReveal as="section" className="section-block">
        <div className="container approach-section">
          <span className="section-label">OUR APPROACH</span>
          <h2>Built for one person's real money, first.</h2>
          <p>Sultan Pocket started as a simple wallet for tracking everyday spending — no ads, no data sharing, no unnecessary complexity. It stays that way: your records are private to your account, the tools are built around how money actually moves day to day, and every feature exists because it was genuinely needed, not because it looks good on a features page.</p>
        </div>
      </ScrollReveal>

      <ScrollReveal as="section" className="section-block">
        <div className="container">
          <TryItWidget />
        </div>
      </ScrollReveal>

      <ScrollReveal as="section" className="section-block">
        <div className="container split-section">
          <div><span className="section-label">BUILT FOR REAL LIFE</span><h2>Know your balance before the month knows you.</h2><p>Whether you are paying bills, receiving your monthly salary, saving for something important, or simply trying to understand your spending, Sultan Pocket gives every transaction a place.</p><Link href="/services" className="text-cta">See all features →</Link></div>
          <div className="benefit-list"><div><b>01</b><span><strong>Separate money clearly</strong><small>Cash, Online, Savings and E-Transit stay easy to understand.</small></span></div><div><b>02</b><span><strong>Record the movement</strong><small>Transfers move balances instead of pretending they are new income or expenses.</small></span></div><div><b>03</b><span><strong>Review your month</strong><small>Use your transaction history and wallet insights to make better decisions.</small></span></div></div>
        </div>
      </ScrollReveal>

      <ScrollReveal as="section" className="section-block section-muted">
        <div className="container">
          <div className="section-heading"><span>FAQ</span><h2>Questions, answered.</h2></div>
          <div className="faq-grid">{FAQS.map(([q, a]) => <div className="faq-card" key={q}><h3>{q}</h3><p>{a}</p></div>)}</div>
          <div className="center-link"><Link href="/faq" className="text-cta">View all FAQs →</Link></div>
        </div>
      </ScrollReveal>

      <ScrollReveal as="section" className="final-cta">
        <div className="container"><Image src="/logo.png" alt="Sultan Pocket" width={52} height={52} /><h2>Ready to take control of your wallet?</h2><p>Create your free account and start tracking your money today.</p><Link href="/signup" className="btn btn-primary hero-btn">Create my account →</Link></div>
      </ScrollReveal>
    </main>
  );
}

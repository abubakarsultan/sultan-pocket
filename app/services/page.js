import Link from 'next/link';

export const metadata = {
  title: 'Features & Services — Sultan Pocket',
  description: 'Explore Sultan Pocket tools for expenses, income, savings, transfers, borrowing, and personal money management.',
};

const services = [
  ['💳', 'Expense Tracking', 'Record everyday expenses by category and payment method so your spending history stays organized.', '/dashboard/wallet'],
  ['💰', 'Income Tracking', 'Add salary and other income while keeping Cash and Online balances accurate.', '/dashboard/wallet'],
  ['🔄', 'Cash ↔ Online Transfers', 'Move money between your cash and online balances without treating the transfer as income or expense.', '/dashboard/wallet'],
  ['🏦', 'Savings', 'Set money aside from your available balance and use it later when you need it.', '/dashboard/wallet'],
  ['🚌', 'E-Transit & Transport', 'Top up E-Transit and record transport spending from the correct source.', '/dashboard/wallet'],
  ['🤝', 'Borrow & Repay', 'Record borrowed money and repayments while keeping the outstanding debt visible.', '/dashboard/wallet'],
  ['📊', 'Wallet Insights', 'Review transactions, balances, monthly activity, and spending patterns from your wallet.', '/dashboard/wallet'],
  ['🗂️', 'Categories', 'Use built-in categories or create custom categories that match your real spending.', '/dashboard/wallet'],
];

export default function ServicesPage() {
  return <main>
    <section className="page-hero"><div className="container narrow"><span className="section-label">SULTAN POCKET FEATURES</span><h1>One wallet for the way you actually use money.</h1><p>From your monthly salary to your daily coffee, Sultan Pocket helps you record the movement of your money clearly.</p><div className="hero-actions"><Link href="/signup" className="btn btn-primary">Get started free →</Link><Link href="/dashboard/wallet" className="btn">Open wallet</Link></div></div></section>
    <section className="section-block"><div className="container"><div className="service-grid">{services.map(([icon,title,desc,href]) => <Link href={href} className="service-card" key={title}><span className="feature-icon">{icon}</span><h2>{title}</h2><p>{desc}</p><span className="feature-link">Learn more →</span></Link>)}</div></div></section>
    <section className="final-cta"><div className="container"><h2>Your money. One clear place.</h2><p>Start with the wallet today and build better financial habits over time.</p><Link href="/signup" className="btn btn-primary">Create your account →</Link></div></section>
  </main>;
}

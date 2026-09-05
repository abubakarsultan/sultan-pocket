'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useWallet } from './WalletProvider';
import { monthLabel, shiftMonth } from '@/lib/wallet/calc';
import { useEffect, useState } from 'react';
import Confetti from '@/components/Confetti';

const NAV_ITEMS = [
  ['', '▦', 'Dashboard'],
  ['/transactions', '↔', 'Transactions'],
  ['/transport', '◉', 'Transport'],
  ['/savings', '▱', 'Savings'],
  ['/debt', '◌', 'Debt & Borrowing'],
  ['/charts', '◒', 'Charts & Stats'],
  ['/reports', '▤', 'Reports'],
  ['/recurring', '↻', 'Recurring']
];

export default function WalletShell({
  children,
  title = 'Manage Your Money'
}) {
  const p = usePathname();
  const r = useRouter();

  const { user, saving, month, setMonth, basePath, guest, guestLimitReached } = useWallet();
  const NAV = NAV_ITEMS.map(([suffix,ic,label])=>[`${basePath}${suffix}`,ic,label]);
  const [gate, setGate] = useState(false);
  const [gateReason, setGateReason] = useState('guest');
  const [celebrate, setCelebrate] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    const celebrateFirst = () => setCelebrate(true);
    window.addEventListener('wallet:first-transaction', celebrateFirst);
    return () => window.removeEventListener('wallet:first-transaction', celebrateFirst);
  }, []);

  useEffect(() => {
    const open = () => { setGateReason('guest'); setGate(true); };
    const openLimit = () => { setGateReason('limit'); setGate(true); };

    window.addEventListener('wallet:gate', open);
    window.addEventListener('wallet:guest-limit', openLimit);

    return () => {
      window.removeEventListener('wallet:gate', open);
      window.removeEventListener('wallet:guest-limit', openLimit);
    };
  }, []);

  const protectedAction = (fn) => {
    if (user || (guest && !guestLimitReached)) {
      fn();
    } else {
      setGateReason('limit');
      setGate(true);
    }
  };

  return (
    <>
      <Confetti active={celebrate} onComplete={() => setCelebrate(false)} />
      <div className="wallet-shell">

      {/* Sidebar */}
      <aside className="wallet-sidebar">

        <Link
          href={basePath}
          className="wallet-brand"
        >
          <span>💳</span>
          <b>Manage Your Money</b>
        </Link>

        <nav>
          {NAV.map(([href, ic, label]) => (
            <Link
              className={p === href ? 'active' : ''}
              key={href}
              href={href}
            >
              <i>{ic}</i>
              {label}
            </Link>
          ))}
        </nav>

        <div className="wallet-side-foot">

          <Link href={user ? '/dashboard' : '/'}>
            {user ? '← Main dashboard' : '← Sultan Pocket home'}
          </Link>

          {user ? (
            <Link
              href={`/u/${encodeURIComponent(
                user.user_metadata?.username ||
                user.email?.split('@')[0] ||
                'user'
              )}`}
            >
              View profile
            </Link>
          ) : (
            <button onClick={() => {setGateReason('guest');setGate(true)}}>
              Guest mode · Create account
            </button>
          )}

        </div>
      </aside>


      {/* Main wallet area */}
      <section className="wallet-main">

        <header className="wallet-topbar">

          <div>
            <h1>{title}</h1>
          </div>

          <div className="wallet-actions">

            <button
              className="wallet-btn"
              aria-label="Previous month"
              onClick={() =>
                setMonth(shiftMonth(month, -1))
              }
            >
              ‹
            </button>

            <div className="wallet-month">
              {monthLabel(month)}
            </div>

            <button
              className="wallet-btn"
              aria-label="Next month"
              onClick={() =>
                setMonth(shiftMonth(month, 1))
              }
            >
              ›
            </button>

            <button
              className="wallet-btn primary"
              onClick={() =>
                protectedAction(() =>
                  window.dispatchEvent(
                    new CustomEvent('wallet:add', {
                      detail: 'income'
                    })
                  )
                )
              }
            >
              + Income
            </button>

            <button
              className="wallet-btn danger"
              onClick={() =>
                protectedAction(() =>
                  window.dispatchEvent(
                    new CustomEvent('wallet:add', {
                      detail: 'expense'
                    })
                  )
                )
              }
            >
              + Expense
            </button>

            <button
              className="wallet-btn"
              onClick={() =>
                protectedAction(() =>
                  window.dispatchEvent(new CustomEvent('wallet:scan-receipt'))
                )
              }
            >
              📷 Scan Receipt
            </button>


            {saving && (
              <span className="wallet-saving">
                Saving…
              </span>
            )}

          </div>
        </header>


        {/* Page content */}
        <main className="wallet-content">
          {children}
        </main>


        {/* Mobile navigation */}
        <nav className="wallet-mobile-nav" aria-label="Wallet navigation">
          <Link className={p === `${basePath}` ? 'active' : ''} href={basePath}><i aria-hidden="true">▦</i><span>Home</span></Link>
          <Link className={p === `${basePath}/transactions` ? 'active' : ''} href={`${basePath}/transactions`}><i aria-hidden="true">↔</i><span>Transactions</span></Link>
          <button type="button" className="wallet-mobile-more-btn" onClick={() => setMoreOpen(true)}><i aria-hidden="true">•••</i><span>More</span></button>
          <button type="button" className="wallet-mobile-add-btn" aria-label="Add transaction" onClick={() => protectedAction(() => window.dispatchEvent(new CustomEvent('wallet:add', { detail: 'expense' })))}><i aria-hidden="true">+</i><span>Add</span></button>
        </nav>

        {moreOpen && <div className="wallet-more-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setMoreOpen(false); }}>
          <section className="wallet-more-sheet" role="dialog" aria-modal="true" aria-label="More wallet tools">
            <div className="wallet-more-head"><strong>More</strong><button type="button" onClick={() => setMoreOpen(false)} aria-label="Close">×</button></div>
            <div className="wallet-more-grid">
              <button type="button" className="wallet-more-scan-btn" onClick={() => { setMoreOpen(false); protectedAction(() => window.dispatchEvent(new CustomEvent('wallet:scan-receipt'))); }}><i>📷</i><span>Scan Receipt</span><b>→</b></button>
              {NAV.slice(2).map(([href, ic, label]) => <Link key={href} href={href} onClick={() => setMoreOpen(false)}><i>{ic}</i><span>{label}</span><b>→</b></Link>)}
            </div>
          </section>
        </div>}

      </section>


      {/* Guest login modal */}
      {gate && (
        <GateModal
          close={() => setGate(false)}
          router={r}
          basePath={basePath}
          reason={gateReason}
        />
      )}

      </div>
    </>
  );
}


function GateModal({ close, router, basePath, reason }) {
  return (
    <div className="gate-backdrop">

      <div className="gate-modal">

        <button
          className="gate-x"
          onClick={close}
          aria-label="Close"
        >
          ×
        </button>

        <div className="gate-icon">
          ↗
        </div>

        <span className="wallet-modal-kicker">
          {reason === 'limit' ? 'GUEST LIMIT' : 'GUEST MODE'}
        </span>

        <h2>
          {reason === 'limit' ? 'Ready to save more?' : 'Use Sultan Pocket for free'}
        </h2>

        <p>
          {reason === 'limit'
            ? 'You can try Sultan Pocket as a guest, but guest storage is limited. Create a free account to save unlimited transactions and keep your data across devices.'
            : 'Try the Expense Tracker without signing up. Your guest transactions are saved only on this device. Create an account when you are ready for permanent cloud storage.'}
        </p>

        <div className="gate-buttons">

          <button
            className="wallet-btn primary"
            onClick={() =>
              router.push(
                `/signin?next=${encodeURIComponent(basePath)}`
              )
            }
          >
            Sign in
          </button>

          <button
            className="wallet-btn"
            onClick={() =>
              router.push(
                `/signup?next=${encodeURIComponent(basePath)}`
              )
            }
          >
            Create account
          </button>

        </div>

      </div>
    </div>
  );
}
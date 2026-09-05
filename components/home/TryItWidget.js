'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedMoney from '@/components/wallet/AnimatedNumber';
import { money } from '@/lib/wallet/calc';

const START_BALANCE = 25000;

const QUICK_PICKS = [
  { icon: '🍔', category: 'Food', amount: 850 },
  { icon: '🚌', category: 'Transport', amount: 150 },
  { icon: '🛍️', category: 'Shopping', amount: 2400 },
  { icon: '💡', category: 'Bills', amount: 3200 },
];

export default function TryItWidget() {
  const [balance, setBalance] = useState(START_BALANCE);
  const [entries, setEntries] = useState([]);
  const [interacted, setInteracted] = useState(false);

  function addExpense(pick) {
    setBalance((b) => b - pick.amount);
    setEntries((list) => [{ ...pick, id: `${pick.category}-${Date.now()}` }, ...list].slice(0, 4));
    setInteracted(true);
  }

  function reset() {
    setBalance(START_BALANCE);
    setEntries([]);
    setInteracted(false);
  }

  return (
    <div className="try-it-widget">
      <div className="try-it-head">
        <span className="try-it-kicker">TRY IT — NO SIGN-UP NEEDED</span>
        <h3>Add a sample expense and watch your balance update.</h3>
        <p>This is a local sandbox — nothing here is saved or sent anywhere.</p>
      </div>

      <div className="try-it-card">
        <div className="try-it-balance">
          <small>Sample balance</small>
          <strong><AnimatedMoney value={money(balance)} /></strong>
        </div>

        <div className="try-it-picks">
          {QUICK_PICKS.map((pick) => (
            <button key={pick.category} type="button" className="try-it-pick" onClick={() => addExpense(pick)}>
              <span>{pick.icon}</span>
              <b>{pick.category}</b>
              <small>− {money(pick.amount)}</small>
            </button>
          ))}
        </div>

        <div className="try-it-list">
          <AnimatePresence initial={false}>
            {entries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="try-it-row"
              >
                <span>{entry.icon} {entry.category}</span>
                <b>− {money(entry.amount)}</b>
              </motion.div>
            ))}
          </AnimatePresence>
          {!entries.length && <p className="try-it-empty">Tap a category above to add your first sample expense.</p>}
        </div>

        <AnimatePresence>
          {interacted && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="try-it-cta"
            >
              <p>Like what you see?</p>
              <div>
                <Link href="/signup" className="btn btn-primary hero-btn">Sign up free →</Link>
                <button type="button" className="text-cta try-it-reset" onClick={reset}>Reset sandbox</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

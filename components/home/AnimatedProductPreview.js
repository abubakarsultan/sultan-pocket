'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import AnimatedNumber from '@/components/wallet/AnimatedNumber';
import { useEffect, useMemo, useState } from 'react';

const DEMO_TRANSACTIONS = [
  { kind: 'expense', icon: '−', title: 'Food', sub: 'Today · Cash', amount: -850 },
  { kind: 'expense', icon: '−', title: 'Transport', sub: 'Today · E-Transit', amount: -250 },
  { kind: 'income', icon: '+', title: 'Freelance', sub: 'Today · Online', amount: 2500 },
];

const START_BALANCE = 48250;

export default function AnimatedProductPreview() {
  const reduce = useReducedMotion();
  const [sampleIndex, setSampleIndex] = useState(0);
  const [typedTitle, setTypedTitle] = useState('');
  const [showTypedRow, setShowTypedRow] = useState(false);
  const [balance, setBalance] = useState(START_BALANCE);
  const sample = useMemo(() => DEMO_TRANSACTIONS[sampleIndex % DEMO_TRANSACTIONS.length], [sampleIndex]);

  useEffect(() => {
    if (reduce) {
      setTypedTitle(sample.title);
      setShowTypedRow(true);
      setBalance(START_BALANCE + sample.amount);
      return undefined;
    }

    let cancelled = false;
    let typeTimer;
    let finishTimer;
    let resetTimer;
    let nextTimer;
    let i = 0;

    setTypedTitle('');
    setShowTypedRow(true);
    setBalance(START_BALANCE);

    const typeNext = () => {
      if (cancelled) return;
      i += 1;
      setTypedTitle(sample.title.slice(0, i));
      if (i < sample.title.length) {
        typeTimer = window.setTimeout(typeNext, 65);
      } else {
        finishTimer = window.setTimeout(() => {
          if (cancelled) return;
          setShowTypedRow(false);
          setBalance(START_BALANCE + sample.amount);
          nextTimer = window.setTimeout(() => {
            if (!cancelled) setSampleIndex(v => v + 1);
          }, 4300);
        }, 650);
      }
    };

    typeTimer = window.setTimeout(typeNext, 420);

    resetTimer = window.setTimeout(() => {
      if (!cancelled) {
        setShowTypedRow(false);
        setBalance(START_BALANCE);
      }
    }, 5700);

    return () => {
      cancelled = true;
      window.clearTimeout(typeTimer);
      window.clearTimeout(finishTimer);
      window.clearTimeout(resetTimer);
      window.clearTimeout(nextTimer);
    };
  }, [sample, reduce]);

  const rowTransition = { duration: 0.3, ease: 'easeOut' };

  return (
    <div className="hero-visual" aria-label="Sultan Pocket wallet preview">
      <motion.div
        className="preview-window"
        initial={reduce ? false : { opacity: 0, y: 30, scale: 0.97 }}
        animate={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="preview-top">
          <span>DEMO WALLET PREVIEW</span>
          <span className="preview-dot">●</span>
        </div>

        <div className="preview-balance">
          <small>Sample data · Available balance</small>
          <strong><AnimatedNumber value={balance} /></strong>
          <span>+ Rs. 60,000 income this month</span>
        </div>

        <div className="preview-cards">
          <motion.div initial={reduce ? false : { opacity: 0, y: 14 }} animate={reduce ? undefined : { opacity: 1, y: 0 }} transition={{ ...rowTransition, delay: 0.15 }}>
            <small>Cash</small><b>Rs. 18,750</b>
          </motion.div>
          <motion.div initial={reduce ? false : { opacity: 0, y: 14 }} animate={reduce ? undefined : { opacity: 1, y: 0 }} transition={{ ...rowTransition, delay: 0.22 }}>
            <small>Online</small><b>Rs. 29,500</b>
          </motion.div>
        </div>

        <div className="preview-list">
          <AnimatePresence initial={false} mode="popLayout">
            {showTypedRow && (
              <motion.div
                key={`typing-${sampleIndex}`}
                layout
                initial={reduce ? false : { opacity: 0, y: -10 }}
                animate={reduce ? undefined : { opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: 10 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <span className={`preview-icon ${sample.kind}`}>{sample.icon}</span>
                <span><b>{typedTitle || 'Typing…'}</b><small>{sample.sub}</small></span>
                <strong>{sample.amount > 0 ? '+' : '−'} Rs. {Math.abs(sample.amount).toLocaleString('en-PK')}</strong>
              </motion.div>
            )}
            {[
              ['income', '+', 'Monthly Salary', 'Aug 1 · Online', '+ Rs. 60,000'],
              ['save', '↗', 'Savings', 'Aug 5 · Cash', '− Rs. 10,000'],
            ].map(([kind, icon, title, sub, amount], i) => (
              <motion.div key={title} layout initial={reduce ? false : { opacity: 0, y: 10 }} animate={reduce ? undefined : { opacity: 1, y: 0 }} transition={{ ...rowTransition, delay: 0.1 + i * 0.08 }}>
                <span className={`preview-icon ${kind}`}>{icon}</span>
                <span><b>{title}</b><small>{sub}</small></span>
                <strong>{amount}</strong>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import AnimatedNumber from '@/components/wallet/AnimatedNumber';
import { useEffect, useMemo, useState } from 'react';

const DEMO_STEPS = [
  {
    kind: 'income', icon: '+', title: 'Monthly Salary', sub: 'Aug 1 · Online', amount: 60000,
    balances: { available: 108250, cash: 18750, online: 89500, savings: 0, etransit: 0 },
    affected: 'online', direction: 'up', movement: 'Money in → Online',
  },
  {
    kind: 'expense', icon: '−', title: 'Food', sub: 'Today · Cash', amount: -850,
    balances: { available: 107400, cash: 17900, online: 89500, savings: 0, etransit: 0 },
    affected: 'cash', direction: 'down', movement: 'Cash → Food',
  },
  {
    kind: 'save', icon: '↗', title: 'Savings', sub: 'Today · Cash', amount: -10000,
    balances: { available: 97400, cash: 7900, online: 89500, savings: 10000, etransit: 0 },
    affected: 'savings', direction: 'up', movement: 'Cash → Savings',
  },
];

const START = { available: 48250, cash: 18750, online: 29500, savings: 0, etransit: 0 };

function money(value) {
  return `Rs. ${Number(value).toLocaleString('en-PK')}`;
}

export default function AnimatedProductPreview() {
  const reduce = useReducedMotion();
  const [stepIndex, setStepIndex] = useState(0);
  const [showStep, setShowStep] = useState(false);
  const [balances, setBalances] = useState(START);
  const step = useMemo(() => DEMO_STEPS[stepIndex % DEMO_STEPS.length], [stepIndex]);

  useEffect(() => {
    if (reduce) {
      setShowStep(true);
      setBalances(step.balances);
      return undefined;
    }

    let cancelled = false;
    let showTimer;
    let updateTimer;
    let nextTimer;

    setShowStep(false);
    setBalances(START);

    showTimer = window.setTimeout(() => {
      if (cancelled) return;
      setShowStep(true);
      updateTimer = window.setTimeout(() => {
        if (!cancelled) setBalances(step.balances);
      }, 520);
    }, 500);

    nextTimer = window.setTimeout(() => {
      if (!cancelled) setStepIndex(v => v + 1);
    }, 4800);

    return () => {
      cancelled = true;
      window.clearTimeout(showTimer);
      window.clearTimeout(updateTimer);
      window.clearTimeout(nextTimer);
    };
  }, [step, reduce]);

  const rowTransition = { duration: 0.3, ease: 'easeOut' };
  const balanceCards = [
    ['cash', 'Cash', balances.cash, 'Physical cash'],
    ['online', 'Online', balances.online, 'Bank / digital'],
    ['savings', 'Savings', balances.savings, 'Money set aside'],
    ['etransit', 'E-Transit', balances.etransit, 'Transport balance'],
  ];

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
          <strong><AnimatedNumber value={balances.available} /></strong>
          <span>{step.direction === 'up' ? '↑' : '↓'} {money(Math.abs(step.amount))} {step.direction === 'up' ? 'added' : 'moved'}</span>
        </div>

        <div className="preview-cards">
          {balanceCards.map(([key, label, value, sub], i) => (
            <motion.div
              key={key}
              className={step.affected === key && showStep ? 'is-affected' : ''}
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ ...rowTransition, delay: 0.12 + i * 0.05 }}
            >
              <small>{label}</small>
              <b><AnimatedNumber value={value} /></b>
              <span>{sub}</span>
            </motion.div>
          ))}
        </div>

        <div className="preview-movement" aria-live="polite">
          <span>Money movement</span>
          <strong>{step.movement}</strong>
          <i className={showStep ? 'is-active' : ''}>→</i>
        </div>

        <div className="preview-list">
          <AnimatePresence initial={false} mode="popLayout">
            {showStep && (
              <motion.div
                key={`step-${stepIndex}`}
                layout
                initial={reduce ? false : { opacity: 0, y: -10 }}
                animate={reduce ? undefined : { opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: 10 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <span className={`preview-icon ${step.kind}`}>{step.icon}</span>
                <span><b>{step.title}</b><small>{step.sub}</small></span>
                <strong>{step.amount > 0 ? '+' : '−'} Rs. {Math.abs(step.amount).toLocaleString('en-PK')}</strong>
              </motion.div>
            )}
            {[
              ['income', '+', 'Monthly Salary', 'Aug 1 · Online', '+ Rs. 60,000'],
              ['save', '↗', 'Savings', 'Aug 5 · Cash', '− Rs. 10,000'],
            ].filter((row) => row[2] !== step.title).map(([kind, icon, title, sub, amount], i) => (
              <motion.div key={title} layout initial={reduce ? false : { opacity: 0, y: 10 }} animate={reduce ? undefined : { opacity: 1, y: 0 }} transition={{ ...rowTransition, delay: 0.1 + i * 0.08 }}>
                <span className={`preview-icon ${kind}`}>{icon}</span>
                <span><b>{title}</b><small>{sub}</small></span>
                <strong>{amount}</strong>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <Link href="/expense-tracker" className="preview-expense-link">Open Expense Tracker <span>→</span></Link>
      </motion.div>
    </div>
  );
}

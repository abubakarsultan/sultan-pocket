'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger);

export function Reveal({ children, className = '', delay = 0 }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={reduce ? undefined : { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }}
    >{children}</motion.div>
  );
}

export function HeroPreview() {
  const reduce = useReducedMotion();
  const rows = [
    ['expense', '−', 'Food', 'Today · Cash', '− Rs. 850'],
    ['income', '+', 'Monthly Salary', 'Aug 1 · Online', '+ Rs. 60,000'],
    ['save', '↗', 'Savings', 'Aug 5 · Cash', '− Rs. 10,000'],
  ];
  return (
    <motion.div
      className="preview-window"
      initial={reduce ? false : { opacity: 0, y: 35, rotate: 1.2, scale: .98 }}
      animate={reduce ? undefined : { opacity: 1, y: 0, rotate: 1.2, scale: 1 }}
      transition={{ duration: .7, ease: [.22, 1, .36, 1] }}
    >
      <div className="preview-top"><span>DEMO WALLET PREVIEW</span><span className="preview-dot">●</span></div>
      <div className="preview-balance"><small>Sample data · Available balance</small><AnimatedCount value={48250} prefix="Rs. " /><span>+ Rs. 60,000 income this month</span></div>
      <div className="preview-cards"><div><small>Cash</small><b>Rs. 18,750</b></div><div><small>Online</small><b>Rs. 29,500</b></div></div>
      <div className="preview-list">
        {rows.map(([type, icon, title, sub, amount], index) => (
          <motion.div key={title} initial={reduce ? false : { opacity: 0, y: 12 }} animate={reduce ? undefined : { opacity: 1, y: 0 }} transition={{ duration: .42, delay: .35 + index * .12 }}>
            <span className={`preview-icon ${type}`}>{icon}</span><span><b>{title}</b><small>{sub}</small></span><strong>{amount}</strong>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function AnimatedCount({ value, prefix = '' }) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);
  useEffect(() => {
    if (reduce) { setDisplay(value); return; }
    let frame;
    const start = performance.now();
    const tick = now => {
      const p = Math.min(1, (now - start) / 900);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduce]);
  return <strong>{prefix}{display.toLocaleString('en-PK')}</strong>;
}

export function BentoFeatures({ features }) {
  const reduce = useReducedMotion();
  return (
    <div className="feature-bento-grid">
      {features.map((feature, index) => (
        <motion.a
          key={feature.title}
          href={feature.href}
          className={`feature-card feature-bento-${index + 1}`}
          initial={reduce ? false : { opacity: 0, y: 22 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: .14 }}
          transition={{ duration: .45, delay: Math.min(index, 4) * .06 }}
          whileHover={reduce ? undefined : { y: -5 }}
        >
          <span className="feature-icon">{feature.icon}</span>
          <h3>{feature.title}</h3>
          <p>{feature.desc}</p>
          <span className="feature-link">Explore →</span>
        </motion.a>
      ))}
    </div>
  );
}

export function StorySection({ eyebrow, title, children, className = '' }) {
  return <Reveal className={className}><div className="container"><div className="section-heading"><span>{eyebrow}</span><h2>{title}</h2>{children}</div></div></Reveal>;
}

export function HowItWorks({ steps }) {
  const root = useRef(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce || !root.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.how-progress-fill', { height: '0%' }, { height: '100%', ease: 'none', scrollTrigger: { trigger: root.current, start: 'top 70%', end: 'bottom 65%', scrub: true } });
      gsap.utils.toArray('.step-card').forEach((card, i) => {
        gsap.fromTo(card, { opacity: .45, y: 18 }, { opacity: 1, y: 0, scrollTrigger: { trigger: card, start: 'top 78%', end: 'top 52%', scrub: true } });
      });
    }, root);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <div ref={root} className="how-steps-wrap">
      <div className="how-progress" aria-hidden="true"><span className="how-progress-fill" /></div>
      <div className="steps-grid">
        {steps.map(([number, title, desc]) => <div className="step-card" key={number}><span>{number}</span><h3>{title}</h3><p>{desc}</p></div>)}
      </div>
    </div>
  );
}

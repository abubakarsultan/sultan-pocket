'use client';

import { useEffect, useRef, useState } from 'react';
import { money } from '@/lib/wallet/calc';

function parseAmount(value) {
  const match = String(value ?? '').replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function detectCurrency(value) {
  const text = String(value ?? '').trim();
  if (text.startsWith('$')) return 'USD';
  if (text.startsWith('£')) return 'GBP';
  if (text.startsWith('€')) return 'EUR';
  return 'PKR';
}

export default function AnimatedMoney({ value, duration = 650 }) {
  const target = parseAmount(value);
  const currency = detectCurrency(value);
  const [display, setDisplay] = useState(0);
  const previous = useRef(0);

  useEffect(() => {
    const start = previous.current;
    const end = target;
    if (start === end) {
      setDisplay(end);
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      previous.current = end;
      setDisplay(end);
      return;
    }

    let frame;
    const startedAt = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = start + (end - start) * eased;
      setDisplay(next);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        previous.current = end;
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return <>{money(display, currency)}</>;
}

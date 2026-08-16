'use client';

import { useEffect, useRef } from 'react';

export default function ScrollReveal({ children, className = '', as: Tag = 'div' }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-visible');
      return;
    }

    el.classList.add('scroll-reveal-ready');

    const show = () => {
      el.classList.add('is-visible');
      observer?.unobserve(el);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) show();
      },
      { threshold: 0.15 }
    );

    observer.observe(el);

    const fallback = window.setTimeout(show, 1800);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return <Tag ref={ref} className={`scroll-reveal ${className}`.trim()}>{children}</Tag>;
}

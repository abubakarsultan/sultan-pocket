'use client';

import { cloneElement, isValidElement, useEffect, useRef } from 'react';

export default function SpotlightCard({ children, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined;

    const move = (event) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--mouse-x', `${((event.clientX - rect.left) / rect.width) * 100}%`);
      el.style.setProperty('--mouse-y', `${((event.clientY - rect.top) / rect.height) * 100}%`);
    };
    const enter = () => el.addEventListener('mousemove', move, { passive: true });
    const leave = () => el.removeEventListener('mousemove', move);

    el.addEventListener('mouseenter', enter);
    el.addEventListener('mouseleave', leave);
    return () => {
      el.removeEventListener('mouseenter', enter);
      el.removeEventListener('mouseleave', leave);
      el.removeEventListener('mousemove', move);
    };
  }, []);

  if (!isValidElement(children)) return children;
  const existingClass = children.props.className || '';
  return cloneElement(children, {
    ref,
    className: `${existingClass} spotlight-card ${className}`.trim(),
  });
}

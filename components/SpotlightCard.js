'use client';

import { cloneElement, isValidElement, useRef } from 'react';

export default function SpotlightCard({ children, className = '' }) {
  const ref = useRef(null);

  function handleMove(e) {
    const el = ref.current;
    if (!el || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mouse-x', `${((e.clientX - rect.left) / rect.width) * 100}%`);
    el.style.setProperty('--mouse-y', `${((e.clientY - rect.top) / rect.height) * 100}%`);
  }

  if (!isValidElement(children)) return children;

  const existingClass = children.props.className || '';
  return cloneElement(children, {
    ref,
    className: `${existingClass} spotlight-card ${className}`.trim(),
    onMouseEnter: (e) => {
      children.props.onMouseEnter?.(e);
    },
    onMouseMove: handleMove,
  });
}

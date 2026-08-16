'use client';

import { useEffect, useMemo } from 'react';

const PIECES = 36;
const SHAPES = ['#0057FF', '#1D9E75', '#D14343', '#F2B84B', '#7A5CFA'];

export default function Confetti({ active, onComplete }) {
  const pieces = useMemo(() => Array.from({length:PIECES}, (_, i) => ({
    id:i,
    color:SHAPES[i % SHAPES.length],
    dx:`${(Math.random() - .5) * 260}px`,
    dy:`${110 + Math.random() * 190}px`,
    rot:`${(Math.random() - .5) * 900}deg`,
    delay:`${Math.random() * .18}s`,
    duration:`${1.8 + Math.random() * .8}s`,
    left:`${35 + Math.random() * 30}%`,
    top:`${35 + Math.random() * 15}%`,
    circle:i % 4 === 0,
  })), []);

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => onComplete?.(), 3000);
    return () => clearTimeout(timer);
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <div aria-hidden="true" style={{position:'fixed',inset:0,zIndex:9998,pointerEvents:'none',overflow:'hidden'}}>
      {pieces.map(p => (
        <span key={p.id} className="confetti-particle" style={{
          left:p.left,top:p.top,background:p.color,
          borderRadius:p.circle?'50%':'2px',
          '--dx':p.dx,'--dy':p.dy,'--rot':p.rot,
          animationDelay:p.delay,animationDuration:p.duration,
        }} />
      ))}
    </div>
  );
}

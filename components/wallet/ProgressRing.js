'use client';

import { useEffect, useState } from 'react';

export default function ProgressRing({ percent=0, size=92, strokeWidth=9, label }) {
  const safe = Math.max(0, Number(percent) || 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = safe >= 100 ? 'var(--danger)' : safe >= 80 ? 'var(--warning, #D99A1A)' : 'var(--success)';
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(safe);
      return;
    }
    const frame = requestAnimationFrame(() => setValue(safe));
    return () => cancelAnimationFrame(frame);
  }, [safe]);

  const offset = circumference * (1 - Math.min(value, 100) / 100);

  return (
    <div style={{position:'relative',width:size,height:size,flex:'0 0 auto'}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${safe}% complete`}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} />
        <circle
          className="progress-ring-value"
          cx={size/2} cy={size/2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
      </svg>
      <strong style={{position:'absolute',inset:0,display:'grid',placeItems:'center',fontSize:13}}>
        {label ?? `${safe}%`}
      </strong>
    </div>
  );
}

// Ready for Budget Planner usage:
// <ProgressRing percent={spent / limit * 100} label={`${spent}/${limit}`} />

'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger);

export default function SmoothScrollProvider({ children }) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger);
    const isWalletRoute = pathname === '/expense-tracker' || pathname.startsWith('/expense-tracker/') || pathname === '/dashboard' || pathname.startsWith('/dashboard/');
    if (isWalletRoute || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({ duration: 1.05, smoothWheel: true, syncTouch: false });
    const updateScrollTrigger = () => ScrollTrigger.update();
    const raf = time => lenis.raf(time * 1000);
    lenis.on('scroll', updateScrollTrigger);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off('scroll', updateScrollTrigger);
      gsap.ticker.remove(raf);
      lenis.destroy();
      ScrollTrigger.refresh();
    };
  }, [pathname]);

  return children;
}

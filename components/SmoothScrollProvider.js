'use client';
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';
import Lenis from 'lenis';
export default function SmoothScrollProvider({children}){
 const pathname=usePathname();
 useEffect(()=>{
  if(pathname?.startsWith('/dashboard')||pathname?.startsWith('/expense-tracker')) return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const lenis=new Lenis({smoothWheel:true,anchors:true});
  let frame=0; const raf=time=>{lenis.raf(time);frame=requestAnimationFrame(raf)}; frame=requestAnimationFrame(raf);
  return()=>{cancelAnimationFrame(frame);lenis.destroy()};
 },[pathname]);
 return children;
}

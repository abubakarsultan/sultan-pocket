'use client';
import {useEffect,useRef} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
export default function AnimatedSteps({steps}){const ref=useRef(null);useEffect(()=>{if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;const ctx=gsap.context(()=>{gsap.from('.gsap-step',{y:35,opacity:0,stagger:.12,duration:.6,ease:'power3.out',scrollTrigger:{trigger:ref.current,start:'top 78%',once:true}})},ref);return()=>ctx.revert()},[]);return <div ref={ref} className="steps-grid gsap-steps">{steps.map(([number,title,desc])=><div className="step-card gsap-step" key={number}><span>{number}</span><h3>{title}</h3><p>{desc}</p></div>)}</div>}

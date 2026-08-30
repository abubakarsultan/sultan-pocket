'use client';

import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useEffect,useRef,useState} from 'react';
import {useAuth} from './AuthProvider';
import {supabase} from '@/lib/supabaseClient';

export default function ProfileMenu({compact=false}){
  const {user}=useAuth();
  const router=useRouter();
  const [open,setOpen]=useState(false);
  const menuRef=useRef(null);
  const firstItemRef=useRef(null);

  useEffect(()=>{
    if(!open)return;
    const outside=(event)=>{if(menuRef.current&&!menuRef.current.contains(event.target))setOpen(false);};
    const escape=(event)=>{if(event.key==='Escape'){setOpen(false);menuRef.current?.querySelector('.profile-trigger')?.focus();}};
    document.addEventListener('mousedown',outside);document.addEventListener('touchstart',outside);document.addEventListener('keydown',escape);
    const timer=setTimeout(()=>firstItemRef.current?.focus(),0);
    return()=>{clearTimeout(timer);document.removeEventListener('mousedown',outside);document.removeEventListener('touchstart',outside);document.removeEventListener('keydown',escape);};
  },[open]);

  if(!user)return null;
  const meta=user.user_metadata||{};
  const username=meta.username||user.email?.split('@')[0]||'user';
  const fullName=meta.full_name||username;
  const avatar=meta.avatar_url;
  const initials=String(fullName).split(/\s+/).filter(Boolean).slice(0,2).map(x=>x.charAt(0).toUpperCase()).join('')||'U';
  const itemStyle={display:'block',width:'100%',padding:'9px 10px',borderRadius:8,color:'var(--text)',fontSize:13,textDecoration:'none',textAlign:'left',background:'transparent',border:0,cursor:'pointer'};

  async function signOut(){setOpen(false);await supabase.auth.signOut();router.push('/signin');}
  const close=()=>setOpen(false);
  const profileUrl=`/u/${encodeURIComponent(username)}`;
  const editUrl=`${profileUrl}?edit=1`;

  return <div ref={menuRef} className="profile-menu-wrap" style={{position:'relative'}}>
    {compact&&<Link href="/dashboard" className="profile-mobile-dashboard-link" aria-label={`Open dashboard for ${fullName}`}>
      <span className="profile-avatar">{avatar?<img src={avatar} alt=""/>:initials}</span>
    </Link>}
    <button className="profile-trigger" onClick={()=>setOpen(v=>!v)} aria-expanded={open} aria-haspopup="menu" aria-label={`Open account menu for ${fullName}`} type="button">
      <span className="profile-avatar">{avatar?<img src={avatar} alt=""/>:initials}</span>
      {!compact&&<span className="profile-trigger-name">{fullName}</span>}
      <span className="profile-chevron" aria-hidden="true">⌄</span>
    </button>
    {open&&<div role="menu" aria-label="Account menu" style={{position:'absolute',right:0,top:'calc(100% + 10px)',width:'min(320px,calc(100vw - 24px))',padding:8,border:'1px solid var(--border)',borderRadius:14,background:'var(--surface)',boxShadow:'0 18px 50px rgba(0,0,0,.18)',zIndex:1000}}>
      <div style={{display:'flex',alignItems:'center',gap:11,padding:'10px 10px 12px'}}>
        <span className="profile-avatar profile-avatar-lg">{avatar?<img src={avatar} alt=""/>:initials}</span>
        <div style={{minWidth:0,flex:1}}><strong style={{display:'block',fontSize:14,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{fullName}</strong><span style={{display:'block',fontSize:12,color:'var(--text-faint)',marginTop:2}}>Free</span></div>
        <button type="button" aria-label="Account plan options" style={{border:0,background:'transparent',color:'var(--text-faint)',fontSize:20,padding:'4px 8px',borderRadius:8}}>›</button>
      </div>
      <div style={{height:1,background:'var(--border)',margin:'0 4px 6px'}} />
      <div style={{display:'grid',gap:2}}>
        <Link ref={firstItemRef} role="menuitem" href={editUrl} onClick={close} style={itemStyle}>Personalization</Link>
        <Link role="menuitem" href={profileUrl} onClick={close} style={itemStyle}>Profile</Link>
        <Link role="menuitem" href="/dashboard/security" onClick={close} style={itemStyle}>Settings & Security</Link>
      </div>
      <div style={{height:1,background:'var(--border)',margin:'6px 4px'}} />
      <div style={{display:'grid',gap:2}}>
        <Link role="menuitem" href="/faq" onClick={close} style={itemStyle}>Help</Link>
        <button role="menuitem" type="button" onClick={signOut} style={{...itemStyle,color:'var(--text)'}}>Log out</button>
      </div>
    </div>}
  </div>;
}

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
  if(!user)return null;

  const meta=user.user_metadata||{};
  const username=meta.username||user.email?.split('@')[0]||'user';
  const fullName=meta.full_name||username;
  const avatar=meta.avatar_url;
  const initials=String(fullName).split(/\s+/).filter(Boolean).slice(0,2).map(x=>x.charAt(0).toUpperCase()).join('')||'U';

  useEffect(()=>{
    if(!open)return;
    const handleOutsideClick=(event)=>{
      if(menuRef.current&&!menuRef.current.contains(event.target))setOpen(false);
    };
    const handleEscape=(event)=>{
      if(event.key==='Escape'){
        setOpen(false);
        menuRef.current?.querySelector('button')?.focus();
      }
    };
    document.addEventListener('mousedown',handleOutsideClick);
    document.addEventListener('touchstart',handleOutsideClick);
    document.addEventListener('keydown',handleEscape);
    const timer=setTimeout(()=>firstItemRef.current?.focus(),0);
    return()=>{
      clearTimeout(timer);
      document.removeEventListener('mousedown',handleOutsideClick);
      document.removeEventListener('touchstart',handleOutsideClick);
      document.removeEventListener('keydown',handleEscape);
    };
  },[open]);

  async function signOut(){
    setOpen(false);
    await supabase.auth.signOut();
    router.push('/signin');
  }

  const close=()=>setOpen(false);
  const profileUrl=`/u/${encodeURIComponent(username)}`;
  const editUrl=`${profileUrl}?edit=1`;

  return <div ref={menuRef} className="profile-menu-wrap" style={{position:'relative'}}>
    <button
      className="profile-trigger"
      onClick={()=>setOpen(v=>!v)}
      aria-expanded={open}
      aria-haspopup="menu"
      aria-label={`Open account menu for ${fullName}`}
      type="button"
    >
      <span className="profile-avatar">{avatar?<img src={avatar} alt=""/>:initials}</span>
      {!compact&&<span className="profile-trigger-name">{fullName}</span>}
      <span className="profile-chevron" aria-hidden="true">⌄</span>
    </button>

    {open&&<div
      className="profile-menu"
      role="menu"
      aria-label="Account menu"
      style={{
        position:'absolute',right:0,top:'calc(100% + 10px)',width:'min(320px,calc(100vw - 24px))',padding:8,
        border:'1px solid var(--border)',borderRadius:14,background:'var(--surface)',boxShadow:'0 18px 50px rgba(0,0,0,.18)',zIndex:1000
      }}
    >
      <div style={{display:'flex',alignItems:'center',gap:11,padding:'10px 10px 12px'}}>
        <span className="profile-avatar profile-avatar-lg">{avatar?<img src={avatar} alt=""/>:initials}</span>
        <div style={{minWidth:0,flex:1}}>
          <strong style={{display:'block',fontSize:14,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{fullName}</strong>
          <span style={{display:'block',fontSize:12,color:'var(--text-faint)',marginTop:2}}>Free</span>
        </div>
        <button type="button" aria-label="Account plan options" style={{border:0,background:'transparent',color:'var(--text-faint)',fontSize:18,padding:'6px 8px',borderRadius:8}}>›</button>
      </div>
      <div style={{height:1,background:'var(--border)',margin:'0 4px 6px'}} />

      <div role="none" style={{display:'grid',gap:2}}>
        <Link ref={firstItemRef} role="menuitem" href={editUrl} onClick={close} className="profile-menu-item">Personalization</Link>
        <Link role="menuitem" href={profileUrl} onClick={close} className="profile-menu-item">Profile</Link>
        <Link role="menuitem" href={editUrl} onClick={close} className="profile-menu-item">Settings</Link>
      </div>

      <div style={{height:1,background:'var(--border)',margin:'6px 4px'}} />
      <div style={{display:'grid',gap:2}}>
        <Link role="menuitem" href="/faq" onClick={close} className="profile-menu-item">Help</Link>
        <button role="menuitem" type="button" onClick={signOut} className="profile-menu-item profile-menu-signout">Log out</button>
      </div>
    </div>}
  </div>;
}

'use client';

import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useEffect,useState} from 'react';
import {useAuth} from './AuthProvider';
import {supabase} from '@/lib/supabaseClient';

export default function ProfileMenu({compact=false}){
  const {user}=useAuth();
  const router=useRouter();
  const [open,setOpen]=useState(false);
  const [theme,setTheme]=useState('system');
  useEffect(()=>{
    if(typeof window!=='undefined')setTheme(localStorage.getItem('sultan-pocket-theme')||'system');
  },[]);
  if(!user)return null;
  const meta=user.user_metadata||{};
  const username=meta.username||user.email?.split('@')[0]||'user';
  const fullName=meta.full_name||username;
  const avatar=meta.avatar_url;
  const initial=String(fullName).charAt(0).toUpperCase();


  function changeTheme(value){
    setTheme(value);
    localStorage.setItem('sultan-pocket-theme',value);
    window.dispatchEvent(new Event('sultan-pocket-theme-change'));
  }

  async function signOut(){
    setOpen(false);
    await supabase.auth.signOut();
    router.push('/signin');
  }

  return <div className="profile-menu-wrap">
    <button className="profile-trigger" onClick={()=>setOpen(v=>!v)} aria-expanded={open} aria-haspopup="menu" aria-label="Open profile menu">
      <span className="profile-avatar">{avatar?<img src={avatar} alt=""/>:initial}</span>
      {!compact&&<span className="profile-trigger-name">{fullName}</span>}
      <span className="profile-chevron" aria-hidden="true">⌄</span>
    </button>
    {open&&<div className="profile-menu" role="menu">
      <div className="profile-menu-head">
        <span className="profile-avatar profile-avatar-lg">{avatar?<img src={avatar} alt=""/>:initial}</span>
        <div><strong>{fullName}</strong><span>@{username}</span></div>
      </div>
      <div className="profile-menu-links">
        <Link href={`/u/${encodeURIComponent(username)}`} onClick={()=>setOpen(false)}>Profile</Link>
        <Link href={`/u/${encodeURIComponent(username)}?edit=1`} onClick={()=>setOpen(false)}>Edit profile</Link>
        <Link href="/dashboard/wallet" onClick={()=>setOpen(false)}>Wallet</Link>
      </div>
      <div className="theme-picker">
        <span>Appearance</span>
        <div className="theme-options" role="group" aria-label="Appearance">
          {['system','light','dark'].map(value=><button key={value} type="button" className={theme===value?'active':''} onClick={()=>changeTheme(value)} aria-pressed={theme===value}>{value[0].toUpperCase()+value.slice(1)}</button>)}
        </div>
      </div>
      <button className="profile-signout" onClick={signOut}>Sign out</button>
    </div>}
  </div>;
}

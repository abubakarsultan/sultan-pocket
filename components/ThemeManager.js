'use client';
import {useEffect} from 'react';

function applyTheme(pref){
  const resolved = pref === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : pref;
  document.documentElement.dataset.theme = resolved;
}

export default function ThemeManager(){
  useEffect(()=>{
    const saved=localStorage.getItem('sultan-pocket-theme')||'system';
    applyTheme(saved);
    const onTheme=()=>applyTheme(localStorage.getItem('sultan-pocket-theme')||'system');
    window.addEventListener('sultan-pocket-theme-change',onTheme);
    return()=>window.removeEventListener('sultan-pocket-theme-change',onTheme);
  },[]);
  return null;
}

'use client';
import {useState} from 'react';
import Link from 'next/link';
import {supabase} from '@/lib/supabaseClient';

export default function ForgotPasswordPage(){
  const [email,setEmail]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');

  async function submit(e){
    e.preventDefault();setError('');setNotice('');
    if(!email.trim()){setError('Please enter your email address.');return;}
    setBusy(true);
    const redirectTo=`${window.location.origin}/reset-password`;
    const {error:e}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo});
    setBusy(false);
    if(e){setError(e.message);return;}
    setNotice('If an account exists for this email, a password reset link has been sent. Check your inbox and spam folder.');
  }

  return <main style={{minHeight:'70vh',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
    <form onSubmit={submit} className="card" style={{width:'100%',maxWidth:380}}>
      <h1 style={{fontSize:19,fontWeight:700,marginBottom:4,textAlign:'center'}}>Reset your password</h1>
      <p style={{fontSize:13,color:'var(--text-faint)',textAlign:'center',marginBottom:20}}>Enter your account email and we'll send you a secure reset link.</p>
      {error&&<div className="form-error" style={{display:'block'}}>{error}</div>}
      {notice&&<div className="form-notice" style={{display:'block'}}>{notice}</div>}
      <div className="field"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" autoComplete="email" required/></div>
      <button type="submit" className="btn btn-primary btn-block" disabled={busy}>{busy?'Sending…':'Send reset link'}</button>
      <p style={{fontSize:12.5,color:'var(--text-faint)',textAlign:'center',marginTop:14}}><Link href="/signin" style={{color:'var(--signal)',fontWeight:600}}>Back to sign in</Link></p>
    </form>
  </main>;
}

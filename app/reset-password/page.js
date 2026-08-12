'use client';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {supabase} from '@/lib/supabaseClient';

export default function ResetPasswordPage(){
  const router=useRouter();
  const [ready,setReady]=useState(false);
  const [password,setPassword]=useState('');
  const [confirm,setConfirm]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');

  useEffect(()=>{
    let active=true;
    (async()=>{
      const params=new URLSearchParams(window.location.search);
      const code=params.get('code');
      if(code){
        const {error:e}=await supabase.auth.exchangeCodeForSession(code);
        if(e){if(active){setError('This reset link is invalid or has expired. Request a new one.');setReady(false);}return;}
      }
      const {data}=await supabase.auth.getSession();
      if(active){
        setReady(Boolean(data.session));
        if(!data.session)setError('This reset link is invalid or has expired. Request a new one.');
      }
    })();
    return()=>{active=false;};
  },[]);

  async function submit(e){
    e.preventDefault();setError('');setNotice('');
    if(password.length<6){setError('Password must be at least 6 characters.');return;}
    if(password!==confirm){setError('Passwords do not match.');return;}
    setBusy(true);
    const {error:e}=await supabase.auth.updateUser({password});
    setBusy(false);
    if(e){setError(e.message);return;}
    setNotice('Password updated successfully. Redirecting to sign in…');
    await supabase.auth.signOut();
    setTimeout(()=>router.replace('/signin'),900);
  }

  return <main style={{minHeight:'70vh',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
    <form onSubmit={submit} className="card" style={{width:'100%',maxWidth:380}}>
      <h1 style={{fontSize:19,fontWeight:700,marginBottom:4,textAlign:'center'}}>Choose a new password</h1>
      <p style={{fontSize:13,color:'var(--text-faint)',textAlign:'center',marginBottom:20}}>Use a strong password you don't reuse elsewhere.</p>
      {error&&<div className="form-error" style={{display:'block'}}>{error}</div>}
      {notice&&<div className="form-notice" style={{display:'block'}}>{notice}</div>}
      {ready&&<>
        <div className="field"><label>New password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" required/></div>
        <div className="field"><label>Confirm password</label><input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} autoComplete="new-password" required/></div>
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>{busy?'Updating…':'Update password'}</button>
      </>}
    </form>
  </main>;
}

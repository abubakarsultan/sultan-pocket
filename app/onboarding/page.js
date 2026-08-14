'use client';

import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {supabase} from '@/lib/supabaseClient';

const MAX=5*1024*1024;
const ALLOWED=['image/jpeg','image/png','image/webp'];

export default function OnboardingPage(){
  const router=useRouter();
  const inputRef=useRef(null);
  const [user,setUser]=useState(null);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [file,setFile]=useState(null);
  const [preview,setPreview]=useState('');
  const [url,setUrl]=useState('');
  const [currency,setCurrency]=useState('PKR');
  const [name,setName]=useState('');

  useEffect(()=>{
    let active=true;
    supabase.auth.getUser().then(({data,error:e})=>{
      if(!active)return;
      if(e||!data.user){router.replace('/signin');return;}
      const u=data.user,m=u.user_metadata||{};
      setUser(u);setName(m.full_name||m.username||'');setCurrency(m.currency||'PKR');setUrl(m.avatar_url||'');setLoading(false);
    });
    return()=>{active=false;};
  },[router]);

  useEffect(()=>()=>{if(preview&&preview.startsWith('blob:'))URL.revokeObjectURL(preview);},[preview]);

  function chooseFile(e){
    const f=e.target.files?.[0];
    setError('');
    if(!f)return;
    if(!ALLOWED.includes(f.type)){setError('Please choose a JPG, PNG, or WEBP image.');e.target.value='';return;}
    if(f.size>MAX){setError('Profile picture must be 5MB or smaller.');e.target.value='';return;}
    if(preview.startsWith('blob:'))URL.revokeObjectURL(preview);
    setFile(f);setUrl('');setPreview(URL.createObjectURL(f));
  }

  function removePicture(){
    setFile(null);setUrl('');if(preview.startsWith('blob:'))URL.revokeObjectURL(preview);setPreview('');if(inputRef.current)inputRef.current.value='';
  }

  function useUrl(v){setUrl(v);if(v.trim()){setFile(null);if(preview.startsWith('blob:'))URL.revokeObjectURL(preview);setPreview('');if(inputRef.current)inputRef.current.value='';}}

  async function save(){
    if(!user)return;
    setBusy(true);setError('');
    let avatarUrl=url.trim();let avatarPath='';let uploadedPath='';
    try{
      if(file){
        const ext=file.name.split('.').pop()?.toLowerCase()||'jpg';
        uploadedPath=`${user.id}/avatar-${crypto.randomUUID()}.${ext}`;
        const {error:e}=await supabase.storage.from('avatars').upload(uploadedPath,file,{contentType:file.type,upsert:false});
        if(e)throw e;
        const {data}=supabase.storage.from('avatars').getPublicUrl(uploadedPath);
        avatarUrl=data.publicUrl;avatarPath=uploadedPath;
      }else if(avatarUrl){
        try{const parsed=new URL(avatarUrl);if(parsed.protocol!=='https:')throw new Error();}catch{throw new Error('Please enter a valid HTTPS image URL.');}
      }
      const oldPath=user.user_metadata?.avatar_path;
      const {error:e}=await supabase.auth.updateUser({data:{full_name:name.trim(),currency,avatar_url:avatarUrl,avatar_path:avatarPath}});
      if(e)throw e;
      if(oldPath&&oldPath!==avatarPath)await supabase.storage.from('avatars').remove([oldPath]);
      router.replace('/dashboard');
    }catch(e){
      if(uploadedPath)await supabase.storage.from('avatars').remove([uploadedPath]);
      setError(e.message||'Could not save your profile.');
      setBusy(false);
    }
  }

  if(loading)return <main className="onboarding-page"><section className="onboarding-card"><p>Loading…</p></section></main>;

  const display=preview||url;
  const initial=String(name||user?.email||'U').charAt(0).toUpperCase();
  return <main className="onboarding-page">
    <section className="onboarding-card">
      <div className="onboarding-success">✓</div>
      <span className="section-label">EMAIL VERIFIED</span>
      <h1>Welcome to Sultan Pocket</h1>
      <p className="onboarding-lead">Your email is verified successfully. Let’s personalize your account before you start.</p>

      {error&&<div className="profile-notice error" style={{margin:'0 0 18px'}}>{error}</div>}

      <div className="onboarding-avatar-wrap">
        <div className="onboarding-avatar">{display?<img src={display} alt="Profile preview"/>:initial}</div>
        <button type="button" className="onboarding-avatar-edit" onClick={()=>inputRef.current?.click()} aria-label="Change profile picture">✎</button>
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseFile} hidden/>

      <div className="avatar-choice-row">
        <button type="button" className="btn" onClick={()=>inputRef.current?.click()}>Upload image</button>
        <span>or</span>
        <input className="onboarding-url" value={url} onChange={e=>useUrl(e.target.value)} placeholder="Paste image URL" />
      </div>
      <div className="onboarding-avatar-help">JPG, PNG or WEBP · max 5MB. You can also use an HTTPS image URL.</div>
      {(file||url)&&<button type="button" className="onboarding-remove" onClick={removePicture}>Remove picture</button>}

      <div className="onboarding-field field"><label>What currency should Sultan Pocket use?</label><select value={currency} onChange={e=>setCurrency(e.target.value)}><option value="PKR">PKR — Pakistani Rupee</option><option value="USD">USD — US Dollar</option><option value="GBP">GBP — British Pound</option><option value="EUR">EUR — Euro</option></select></div>

      <button className="btn btn-primary btn-block onboarding-continue" onClick={save} disabled={busy}>{busy?'Saving…':'Continue to Dashboard →'}</button>
      <button className="onboarding-skip" onClick={()=>router.replace('/dashboard')} disabled={busy}>Skip for now</button>
    </section>
  </main>;
}

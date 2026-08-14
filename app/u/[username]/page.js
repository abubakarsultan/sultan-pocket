'use client';

import {useEffect,useRef,useState} from 'react';
import {useParams,useRouter} from 'next/navigation';
import {useAuth} from '@/components/AuthProvider';
import {supabase} from '@/lib/supabaseClient';

const MAX_AVATAR_SIZE=5*1024*1024;
const AVATAR_TYPES=['image/jpeg','image/png','image/webp'];

export default function ProfilePage(){
  const {username}=useParams();
  const {user,loading}=useAuth();
  const router=useRouter();
  const inputRef=useRef(null);
  const [allowed,setAllowed]=useState(false);
  const [editing,setEditing]=useState(false);
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState('');
  const [error,setError]=useState('');
  const [newPassword,setNewPassword]=useState('');
  const [avatarFile,setAvatarFile]=useState(null);
  const [avatarPreview,setAvatarPreview]=useState('');
  const [form,setForm]=useState({full_name:'',username:'',bio:'',avatar_url:'',avatar_path:'',currency:'PKR',date_format:'DD/MM/YYYY',default_payment_method:'cash',default_expense_category:'Food',default_income_category:'Monthly Salary'});

  useEffect(()=>{
    if(loading)return;
    const own=(user?.user_metadata?.username||user?.email?.split('@')[0]||'user').toLowerCase()===String(username).toLowerCase();
    if(!user||!own){router.replace('/signin?next='+encodeURIComponent('/u/'+username));return;}
    setAllowed(true);
    const m=user.user_metadata||{};
    setForm({full_name:m.full_name||'',username:m.username||username,bio:m.bio||'',avatar_url:m.avatar_url||'',avatar_path:m.avatar_path||'',currency:m.currency||'PKR',date_format:m.date_format||'DD/MM/YYYY',default_payment_method:m.default_payment_method||'cash',default_expense_category:m.default_expense_category||'Food',default_income_category:m.default_income_category||'Monthly Salary'});
  },[loading,user,username,router]);

  useEffect(()=>{if(typeof window!=='undefined'&&new URLSearchParams(window.location.search).get('edit')==='1')setEditing(true);},[]);
  useEffect(()=>()=>{if(avatarPreview.startsWith('blob:'))URL.revokeObjectURL(avatarPreview);},[avatarPreview]);

  if(loading||!allowed)return <main style={{padding:60,textAlign:'center',color:'var(--text-faint)'}}>Loading…</main>;

  const initial=String(form.full_name||form.username||'U').charAt(0).toUpperCase();
  const set=(k,v)=>setForm(x=>({...x,[k]:v}));
  const displayAvatar=avatarPreview||form.avatar_url;

  function chooseAvatar(e){
    const f=e.target.files?.[0];setError('');
    if(!f)return;
    if(!AVATAR_TYPES.includes(f.type)){setError('Please choose a JPG, PNG, or WEBP image.');e.target.value='';return;}
    if(f.size>MAX_AVATAR_SIZE){setError('Profile picture must be 5MB or smaller.');e.target.value='';return;}
    if(avatarPreview.startsWith('blob:'))URL.revokeObjectURL(avatarPreview);
    setAvatarFile(f);setAvatarPreview(URL.createObjectURL(f));set('avatar_url','');
  }

  function setAvatarUrl(v){setAvatarUrlValue(v);}
  function setAvatarUrlValue(v){set('avatar_url',v);if(v.trim()){setAvatarFile(null);if(avatarPreview.startsWith('blob:'))URL.revokeObjectURL(avatarPreview);setAvatarPreview('');if(inputRef.current)inputRef.current.value='';}}
  function removeAvatar(){setAvatarFile(null);set('avatar_url','');setAvatarPreview('');if(inputRef.current)inputRef.current.value='';}

  async function save(){
    const nextUsername=form.username.trim();
    if(!/^[a-zA-Z0-9_.]{3,20}$/.test(nextUsername)){setError('Username should be 3–20 characters using letters, numbers, _ or .');return;}
    if(form.avatar_url.trim()){
      try{const u=new URL(form.avatar_url.trim());if(u.protocol!=='https:')throw new Error();}catch{setError('Profile picture URL must be a valid HTTPS URL.');return;}
    }
    setBusy(true);setError('');setNotice('');
    let avatarUrl=form.avatar_url.trim();let avatarPath=form.avatar_path||'';let uploadedPath='';
    try{
      if(avatarFile){
        const ext=avatarFile.name.split('.').pop()?.toLowerCase()||'jpg';
        uploadedPath=`${user.id}/avatar-${crypto.randomUUID()}.${ext}`;
        const {error:e}=await supabase.storage.from('avatars').upload(uploadedPath,avatarFile,{contentType:avatarFile.type,upsert:false});
        if(e)throw e;
        const {data}=supabase.storage.from('avatars').getPublicUrl(uploadedPath);
        avatarUrl=data.publicUrl;avatarPath=uploadedPath;
      }else if(!avatarUrl){avatarPath='';}
      const oldPath=user.user_metadata?.avatar_path||'';
      const {error:e}=await supabase.auth.updateUser({data:{full_name:form.full_name.trim(),username:nextUsername,bio:form.bio.trim(),avatar_url:avatarUrl,avatar_path:avatarPath,currency:form.currency,date_format:form.date_format,default_payment_method:form.default_payment_method,default_expense_category:form.default_expense_category,default_income_category:form.default_income_category}});
      if(e)throw e;
      if(oldPath&&oldPath!==avatarPath)await supabase.storage.from('avatars').remove([oldPath]);
      setAvatarFile(null);setAvatarPreview('');setForm(x=>({...x,avatar_url:avatarUrl,avatar_path:avatarPath,username:nextUsername}));
      setNotice('Profile updated successfully.');setEditing(false);setBusy(false);
      router.replace('/u/'+encodeURIComponent(nextUsername));
    }catch(e){if(uploadedPath)await supabase.storage.from('avatars').remove([uploadedPath]);setError(e.message||'Could not update your profile.');setBusy(false);}
  }

  async function changePassword(){if(newPassword.length<6){setError('Password must be at least 6 characters.');return;}setBusy(true);setError('');const {error:e}=await supabase.auth.updateUser({password:newPassword});setBusy(false);if(e)setError(e.message);else{setNewPassword('');setNotice('Password updated successfully.');}}
  async function signOut(){await supabase.auth.signOut();router.push('/signin');}
  async function deleteAccount(){const confirmed=window.confirm('Delete your account permanently? This removes your account and Wallet data and cannot be undone.');if(!confirmed)return;setBusy(true);setError('');const {error:e}=await supabase.rpc('delete_my_account');setBusy(false);if(e){setError(e.message||'Could not delete your account.');return;}await supabase.auth.signOut();router.replace('/');}

  return <main className="profile-page"><section className="profile-card">
    <div className="profile-cover">
      <div className="profile-large-avatar-wrap">
        <div className="profile-large-avatar">{displayAvatar?<img src={displayAvatar} alt="Profile"/>:initial}</div>
        {editing&&<button type="button" className="profile-avatar-edit" onClick={()=>inputRef.current?.click()} aria-label="Change profile picture">✎</button>}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseAvatar} hidden/>
      <div><span className="profile-private">PRIVATE PROFILE</span><h1>{form.full_name||form.username}</h1><p>@{form.username}</p></div>
      <button className="btn btn-primary profile-edit-btn" onClick={()=>{setEditing(v=>!v);setError('');}}>{editing?'Cancel':'Edit profile'}</button>
    </div>
    {notice&&<div className="profile-notice success">{notice}</div>}{error&&<div className="profile-notice error">{error}</div>}
    {editing?<div className="profile-form">
      <div className="profile-form-grid">
        <div className="field"><label>Full name</label><input value={form.full_name} onChange={e=>set('full_name',e.target.value)} placeholder="Your name"/></div>
        <div className="field"><label>Username</label><input value={form.username} onChange={e=>set('username',e.target.value)} placeholder="username"/></div>
        <div className="field profile-full"><label>Profile picture</label><div className="avatar-input-row"><button type="button" className="btn" onClick={()=>inputRef.current?.click()}>Upload image</button><span>or</span><input value={form.avatar_url} onChange={e=>setAvatarUrl(e.target.value)} placeholder="Paste HTTPS image URL"/></div><small className="profile-help">JPG, PNG or WEBP · max 5MB. Upload and URL are alternatives.</small>{(avatarFile||form.avatar_url)&&<button type="button" className="profile-remove-avatar" onClick={removeAvatar}>Remove picture</button>}</div>
        <div className="field profile-full"><label>Bio</label><textarea value={form.bio} onChange={e=>set('bio',e.target.value)} placeholder="Tell us a little about yourself"/></div>
        <div className="field"><label>Currency</label><select value={form.currency} onChange={e=>set('currency',e.target.value)}><option>PKR</option><option>USD</option><option>GBP</option><option>EUR</option></select></div>
        <div className="field"><label>Date format</label><select value={form.date_format} onChange={e=>set('date_format',e.target.value)}><option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option></select></div>
        <div className="field"><label>Default payment method</label><select value={form.default_payment_method} onChange={e=>set('default_payment_method',e.target.value)}><option value="cash">Cash</option><option value="online">Online</option></select></div>
        <div className="field"><label>Default expense category</label><select value={form.default_expense_category} onChange={e=>set('default_expense_category',e.target.value)}><option>Transport</option><option>Food</option><option>Shopping</option><option>Bills</option><option>Entertainment</option><option>Education</option><option>Personal</option><option>Other</option></select></div>
        <div className="field"><label>Default income category</label><select value={form.default_income_category} onChange={e=>set('default_income_category',e.target.value)}><option>Monthly Salary</option><option>Family</option><option>Other Income</option></select></div>
      </div>
      <div className="profile-form-actions"><button className="btn btn-primary" onClick={save} disabled={busy}>{busy?'Saving…':'Save changes'}</button></div>
    </div>:<div className="profile-sections">
      <section><h2>Personal information</h2><div className="profile-detail-grid"><Detail label="Full name" value={form.full_name||'Not set'}/><Detail label="Username" value={'@'+form.username}/><Detail label="Email" value={user.email||'Not available'}/><Detail label="Bio" value={form.bio||'No bio added.'}/></div></section>
      <section><h2>Wallet preferences</h2><div className="profile-detail-grid"><Detail label="Currency" value={form.currency}/><Detail label="Date format" value={form.date_format}/><Detail label="Default payment" value={form.default_payment_method==='cash'?'Cash':'Online'}/><Detail label="Default expense" value={form.default_expense_category}/><Detail label="Default income" value={form.default_income_category}/><Detail label="Profile visibility" value="Private"/></div></section>
      <section><h2>Account information</h2><div className="profile-detail-grid"><Detail label="Account created" value={user.created_at?new Date(user.created_at).toLocaleDateString('en-GB'):'—'}/><Detail label="Authentication" value="Email account"/><Detail label="Wallet data" value="Private to your account"/><Detail label="Profile URL" value={`/u/${form.username}`}/></div></section>
      <section><h2>Security</h2><div className="password-row"><input type="password" placeholder="New password" value={newPassword} onChange={e=>setNewPassword(e.target.value)}/><button className="btn" onClick={changePassword} disabled={busy}>Change password</button></div><p className="profile-help">Your profile and Wallet data are private. Sign out when using a shared device.</p></section>
      <section className="profile-danger"><h2>Account actions</h2><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button className="btn profile-signout-btn" onClick={signOut} disabled={busy}>Sign out</button><button className="btn profile-delete-btn" onClick={deleteAccount} disabled={busy}>Delete account</button></div><p className="profile-help">Deleting your account permanently removes your account and Wallet data.</p></section>
    </div>}
  </section></main>;
}
function Detail({label,value}){return <div className="profile-detail"><span>{label}</span><strong>{value}</strong></div>}

'use client';

import {useEffect,useMemo,useState} from 'react';
import {useAuth} from '@/components/AuthProvider';
import {supabase} from '@/lib/supabaseClient';
import {money} from '@/lib/wallet/calc';

const CATEGORIES=['Subscription','Internet','Electricity','Utilities','Insurance','Rent','Other'];

function nextDueDate(day){
  const now=new Date();
  const safeDay=Math.min(31,Math.max(1,Number(day)||1));
  let year=now.getFullYear(),month=now.getMonth();
  const days=new Date(year,month+1,0).getDate();
  let due=new Date(year,month,Math.min(safeDay,days));
  if(due<new Date(now.getFullYear(),now.getMonth(),now.getDate())){
    month+=1;
    const nextDays=new Date(year,month+1,0).getDate();
    due=new Date(year,month,Math.min(safeDay,nextDays));
  }
  return due;
}

function dueLabel(day){
  const due=nextDueDate(day); const today=new Date();
  const start=new Date(today.getFullYear(),today.getMonth(),today.getDate());
  const diff=Math.round((due-start)/86400000);
  if(diff===0)return 'Due today';
  if(diff===1)return 'Due tomorrow';
  return `Due in ${diff} days`;
}

export default function BillsPage(){
  const {user,loading}=useAuth();
  const [bills,setBills]=useState([]); const [modal,setModal]=useState(null); const [busy,setBusy]=useState(false); const [message,setMessage]=useState('');
  const [form,setForm]=useState({name:'',amount:'',due_day:'',category:'Subscription'});
  const currency=user?.user_metadata?.currency||'PKR';
  async function load(){if(!user)return;const {data,error}=await supabase.from('wallet_bills').select('*').eq('user_id',user.id).order('due_day',{ascending:true}).order('name',{ascending:true});if(error){setMessage(error.message);return;}setBills(data||[]);}
  useEffect(()=>{load();},[user]);
  const ordered=useMemo(()=>bills.slice().sort((a,b)=>nextDueDate(a.due_day)-nextDueDate(b.due_day)),[bills]);
  const monthlyTotal=bills.reduce((sum,b)=>sum+Number(b.amount||0),0);
  function openNew(){setForm({name:'',amount:'',due_day:'',category:'Subscription'});setModal({type:'form'});setMessage('');}
  function openEdit(b){setForm({name:b.name,amount:String(b.amount),due_day:String(b.due_day),category:b.category||'Other'});setModal({type:'form',bill:b});setMessage('');}
  async function save(e){e.preventDefault();if(!user)return;const name=form.name.trim();const amount=Number(form.amount);const day=Number(form.due_day);if(!name||amount<=0||day<1||day>31){setMessage('Enter a bill name, valid amount, and due day from 1 to 31.');return;}setBusy(true);const row={user_id:user.id,name,amount,due_day:day,category:form.category};const q=modal.bill?supabase.from('wallet_bills').update(row).eq('id',modal.bill.id).eq('user_id',user.id).select('*').single():supabase.from('wallet_bills').insert(row).select('*').single();const {data,error}=await q;setBusy(false);if(error){setMessage(error.message);return;}setBills(x=>modal.bill?x.map(b=>b.id===data.id?data:b):[...x,data]);setModal(null);setMessage('Bill saved');}
  async function remove(b){if(!confirm(`Delete ${b.name}?`))return;const {error}=await supabase.from('wallet_bills').delete().eq('id',b.id).eq('user_id',user.id);if(error){setMessage(error.message);return;}setBills(x=>x.filter(v=>v.id!==b.id));setMessage('Bill removed');}
  if(loading||!user)return <main className="container" style={{padding:'48px 24px',textAlign:'center'}}>Loading…</main>;
  return <main className="container" style={{padding:'48px 24px 70px'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:14,flexWrap:'wrap',marginBottom:22}}>
      <div><span className="wallet-section-kicker">BILL & SUBSCRIPTION REMINDER</span><h1 style={{fontSize:24,marginTop:4}}>Never miss a due date.</h1><p style={{fontSize:13,color:'var(--text-faint)',marginTop:5}}>Keep recurring bills and subscriptions in one place. This is a reminder list — it does not create Wallet expenses automatically.</p></div>
      <button className="wallet-btn primary" onClick={openNew}>+ Add bill</button>
    </div>
    {message&&<div className="wallet-notice success" style={{marginBottom:15}}>{message}</div>}
    <div className="wallet-grid three" style={{marginBottom:15}}>
      <div className="wallet-card" style={{'--accent':'var(--signal)'}}><small>Monthly bills</small><strong>{money(monthlyTotal,currency)}</strong><span>{bills.length} recurring {bills.length===1?'bill':'bills'}</span></div>
      <div className="wallet-card" style={{'--accent':'#8656C4'}}><small>Next due</small><strong>{ordered[0]?ordered[0].name:'—'}</strong><span>{ordered[0]?dueLabel(ordered[0].due_day):'Add a bill to start'}</span></div>
      <div className="wallet-card" style={{'--accent':'#D99B00'}}><small>Reminder categories</small><strong>{new Set(bills.map(b=>b.category)).size}</strong><span>Categories in use</span></div>
    </div>
    <section className="wallet-panel">
      <div className="wallet-panel-head"><div><span className="wallet-section-kicker">UPCOMING BILLS</span><h2>Due-date list</h2></div><span>{bills.length} total</span></div>
      {!ordered.length?<div className="wallet-empty">No bills yet. Add Netflix, internet, electricity, or another recurring payment.</div>:<div style={{display:'grid',gap:0}}>{ordered.map(b=><div key={b.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:15,padding:'14px 0',borderBottom:'1px solid var(--border)'}}><div style={{minWidth:0}}><div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}><strong style={{fontSize:13}}>{b.name}</strong><span className="wallet-pill">{b.category||'Other'}</span></div><div style={{fontSize:11,color:'var(--text-faint)',marginTop:4}}>Due day {b.due_day} · {dueLabel(b.due_day)}</div></div><div style={{display:'flex',alignItems:'center',gap:14,flexShrink:0}}><strong style={{fontSize:13}}>{money(b.amount,currency)}</strong><button className="table-action edit" onClick={()=>openEdit(b)}>Edit</button><button className="table-action delete" onClick={()=>remove(b)}>Delete</button></div></div>)}</div>}
    </section>
    {modal&&<div className="gate-backdrop"><form className="wallet-modal" onSubmit={save}><div className="wallet-modal-head"><div><span className="wallet-modal-kicker">{modal.bill?'EDIT BILL':'NEW BILL'}</span><h2>{modal.bill?'Edit bill':'Add bill or subscription'}</h2></div><button type="button" className="icon-button" onClick={()=>setModal(null)}>×</button></div><div className="wallet-form-grid"><label>Bill name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Netflix" autoFocus required/></label><label>Amount<input type="number" min="1" step="1" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="1100" required/></label><label>Due day<input type="number" min="1" max="31" step="1" value={form.due_day} onChange={e=>setForm({...form,due_day:e.target.value})} placeholder="15" required/></label><label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></label></div><div className="wallet-modal-foot"><button type="button" className="wallet-btn secondary" onClick={()=>setModal(null)} disabled={busy}>Cancel</button><button className="wallet-btn primary" disabled={busy}>{busy?'Saving…':modal.bill?'Update bill':'Save bill'}</button></div></form></div>}
  </main>;
}

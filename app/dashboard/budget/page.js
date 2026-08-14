'use client';

import {useEffect,useMemo,useState} from 'react';
import {useRouter} from 'next/navigation';
import {useAuth} from '@/components/AuthProvider';
import {supabase} from '@/lib/supabaseClient';
import {DEFAULT_EXPENSE_CATEGORIES,money,monthLabel,shiftMonth,stats} from '@/lib/wallet/calc';

function BudgetModal({open,onClose,onSave,category,initialAmount,saving}){
  const [amount,setAmount]=useState(initialAmount||'');
  useEffect(()=>{if(open)setAmount(initialAmount||'');},[open,initialAmount]);
  if(!open)return null;
  return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}>
    <div className="card" style={{width:'min(440px,calc(100vw - 32px))',padding:24}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:16,alignItems:'flex-start',marginBottom:20}}>
        <div><h2 style={{fontSize:19,marginBottom:5}}>{initialAmount?'Edit':'Set'} {category} budget</h2><p style={{fontSize:13,color:'var(--text-faint)'}}>Monthly spending limit</p></div>
        <button className="btn btn-ghost" onClick={onClose} aria-label="Close">×</button>
      </div>
      <label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:7}}>Limit amount</label>
      <input className="input" type="number" min="1" step="1" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="10000" autoFocus />
      <div style={{display:'flex',justifyContent:'flex-end',gap:9,marginTop:20}}>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" disabled={saving||Number(amount)<=0} onClick={()=>onSave(Number(amount))}>{saving?'Saving…':'Save budget'}</button>
      </div>
    </div>
  </div>;
}

export default function BudgetPage(){
  const {user,loading}=useAuth();
  const router=useRouter();
  const [month,setMonth]=useState(()=>new Date().toISOString().slice(0,7));
  const [transactions,setTransactions]=useState([]);
  const [categories,setCategories]=useState([]);
  const [budgets,setBudgets]=useState([]);
  const [loadingData,setLoadingData]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const [modal,setModal]=useState({open:false,category:'',amount:''});

  useEffect(()=>{if(!loading&&!user)router.replace('/signin');},[loading,user,router]);

  useEffect(()=>{
    if(!user)return;
    let active=true;
    (async()=>{
      setLoadingData(true);setError('');
      const [{data:txRows,error:txError},{data:catRows,error:catError},{data:budgetRows,error:budgetError}]=await Promise.all([
        supabase.from('wallet_transactions').select('id,type,amount,date,category,method,created_at').eq('user_id',user.id),
        supabase.from('wallet_categories').select('id,name,type,created_at').eq('user_id',user.id).eq('type','expense').order('created_at',{ascending:true}),
        supabase.from('wallet_budgets').select('*').eq('user_id',user.id).eq('month',month).order('category',{ascending:true}),
      ]);
      if(!active)return;
      if(txError||catError||budgetError){setError(budgetError?.message||txError?.message||catError?.message||'Could not load Budget Planner.');}
      setTransactions(txRows||[]);setCategories(catRows||[]);setBudgets(budgetRows||[]);setLoadingData(false);
    })();
    return()=>{active=false;};
  },[user,month]);

  const categoryNames=useMemo(()=>Array.from(new Set([...DEFAULT_EXPENSE_CATEGORIES,...categories.map(c=>c.name)])),[categories]);
  const spending=useMemo(()=>stats(transactions,month).byCategory,[transactions,month]);
  const budgetMap=useMemo(()=>Object.fromEntries(budgets.map(b=>[b.category,b])),[budgets]);
  const rows=useMemo(()=>categoryNames.map(category=>({category,spent:Number(spending[category]||0),budget:Number(budgetMap[category]?.limit_amount||0),id:budgetMap[category]?.id||null})),[categoryNames,spending,budgetMap]);
  const planned=budgets.reduce((sum,b)=>sum+Number(b.limit_amount||0),0);
  const spent=Object.values(spending).reduce((sum,n)=>sum+Number(n||0),0);
  const remaining=planned-spent;
  const currency=user?.user_metadata?.currency||'PKR';

  async function saveBudget(amount){
    if(!modal.category||amount<=0)return;
    setSaving(true);setError('');
    const existing=budgetMap[modal.category];
    const payload={user_id:user.id,category:modal.category,month,limit_amount:amount};
    const result=existing
      ? await supabase.from('wallet_budgets').update({limit_amount:amount}).eq('id',existing.id).eq('user_id',user.id).select('*').single()
      : await supabase.from('wallet_budgets').insert(payload).select('*').single();
    setSaving(false);
    if(result.error){setError(result.error.message||'Could not save this budget.');return;}
    setBudgets(prev=>existing?prev.map(b=>b.id===existing.id?result.data:b):[...prev,result.data]);
    setModal({open:false,category:'',amount:''});
  }

  async function removeBudget(row){
    if(!row.id)return;
    setSaving(true);setError('');
    const {error:e}=await supabase.from('wallet_budgets').delete().eq('id',row.id).eq('user_id',user.id);
    setSaving(false);
    if(e){setError(e.message||'Could not remove this budget.');return;}
    setBudgets(prev=>prev.filter(b=>b.id!==row.id));
  }

  if(loading||!user)return <main style={{padding:60,textAlign:'center',color:'var(--text-faint)'}}>Loading…</main>;

  return <main className="container" style={{padding:'36px 24px 56px'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:16,flexWrap:'wrap',marginBottom:25}}>
      <div><button className="btn btn-ghost" style={{marginBottom:10}} onClick={()=>router.push('/dashboard')}>← Dashboard</button><h1 style={{fontSize:27,fontWeight:750,marginBottom:6}}>Budget Planner</h1><p style={{fontSize:14,color:'var(--text-faint)'}}>Set monthly limits and compare them with your real Wallet spending.</p></div>
      <div style={{display:'flex',alignItems:'center',gap:7}}><button className="btn btn-ghost" onClick={()=>setMonth(shiftMonth(month,-1))}>←</button><div className="card" style={{padding:'10px 15px',minWidth:150,textAlign:'center',fontWeight:650}}>{monthLabel(month)}</div><button className="btn btn-ghost" onClick={()=>setMonth(shiftMonth(month,1))}>→</button></div>
    </div>

    {error&&<div className="card" style={{padding:14,marginBottom:18,borderColor:'var(--danger)',color:'var(--danger)',fontSize:13}}>{error}</div>}

    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginBottom:24}}>
      <div className="card" style={{padding:18}}><div style={{fontSize:12,color:'var(--text-faint)',marginBottom:7}}>Total budget</div><div style={{fontSize:23,fontWeight:750}}>{money(planned,currency)}</div></div>
      <div className="card" style={{padding:18}}><div style={{fontSize:12,color:'var(--text-faint)',marginBottom:7}}>Actual spent</div><div style={{fontSize:23,fontWeight:750}}>{money(spent,currency)}</div></div>
      <div className="card" style={{padding:18}}><div style={{fontSize:12,color:'var(--text-faint)',marginBottom:7}}>{remaining>=0?'Remaining':'Over budget'}</div><div style={{fontSize:23,fontWeight:750,color:remaining<0?'var(--danger)':'inherit'}}>{money(Math.abs(remaining),currency)}</div></div>
    </div>

    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}><div><h2 style={{fontSize:18,marginBottom:3}}>Category budgets</h2><p style={{fontSize:13,color:'var(--text-faint)'}}>Spending is calculated directly from your Wallet transactions.</p></div></div>

    {loadingData?<div className="card" style={{padding:30,textAlign:'center',color:'var(--text-faint)'}}>Loading budgets…</div>:<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:12}}>{rows.map(row=>{
      const hasBudget=row.budget>0;const percent=hasBudget?Math.round((row.spent/row.budget)*100):0;const width=Math.min(100,Math.max(0,percent));const over=hasBudget&&row.spent>row.budget;
      return <div className="card" key={row.category} style={{padding:18}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'flex-start'}}><div><div style={{fontWeight:700,fontSize:15}}>{row.category}</div><div style={{fontSize:13,color:'var(--text-faint)',marginTop:3}}>{hasBudget?`${money(row.spent,currency)} spent of ${money(row.budget,currency)}`:'No monthly limit set'}</div></div><button className="btn btn-ghost" style={{fontSize:12,padding:'7px 10px'}} onClick={()=>setModal({open:true,category:row.category,amount:row.budget||''})}>{hasBudget?'Edit':'Set budget'}</button></div>
        {hasBudget&&<><div style={{height:8,borderRadius:99,background:'var(--surface-2)',overflow:'hidden',marginTop:16}}><div style={{height:'100%',width:`${width}%`,background:over?'var(--danger)':'var(--signal)',borderRadius:99,transition:'width .2s'}}/></div><div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginTop:8}}><span style={{color:over?'var(--danger)':'var(--text-faint)'}}>{percent}% used{over?' · over limit':''}</span><span style={{color:over?'var(--danger)':'var(--text-faint)'}}>{over?`${money(row.spent-row.budget,currency)} over`:`${money(row.budget-row.spent,currency)} left`}</span></div><button onClick={()=>removeBudget(row)} disabled={saving} style={{border:0,background:'none',padding:0,marginTop:12,color:'var(--text-faint)',fontSize:12,cursor:'pointer'}}>Remove budget</button></>}
      </div>;
    })}</div>}

    <BudgetModal open={modal.open} onClose={()=>setModal({open:false,category:'',amount:''})} onSave={saveBudget} category={modal.category} initialAmount={modal.amount} saving={saving}/>
  </main>;
}

'use client';

import {useEffect,useMemo,useState} from 'react';
import {useRouter} from 'next/navigation';
import {useAuth} from '@/components/AuthProvider';
import {supabase} from '@/lib/supabaseClient';
import {money} from '@/lib/wallet/calc';

function GoalModal({open,onClose,onSave,initial,saving}){
  const [name,setName]=useState('');
  const [target,setTarget]=useState('');
  const [date,setDate]=useState('');
  useEffect(()=>{if(open){setName(initial?.name||'');setTarget(initial?.target_amount||'');setDate(initial?.target_date||'');}},[open,initial]);
  if(!open)return null;
  return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}>
    <div className="card" style={{width:'min(460px,calc(100vw - 32px))',padding:24}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}><div><h2 style={{fontSize:19,marginBottom:5}}>{initial?'Edit goal':'New savings goal'}</h2><p style={{fontSize:13,color:'var(--text-faint)'}}>Give your savings a clear destination.</p></div><button className="btn btn-ghost" onClick={onClose}>×</button></div>
      <label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:7}}>Goal name<input className="input" style={{display:'block',width:'100%',marginTop:7}} value={name} onChange={e=>setName(e.target.value)} placeholder="New Laptop" required autoFocus/></label>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:14}}>
        <label style={{fontSize:13,fontWeight:600}}>Target amount<input className="input" style={{display:'block',width:'100%',marginTop:7}} type="number" min="1" step="1" value={target} onChange={e=>setTarget(e.target.value)} placeholder="50000" required/></label>
        <label style={{fontSize:13,fontWeight:600}}>Deadline<input className="input" style={{display:'block',width:'100%',marginTop:7}} type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
      </div>
      <div style={{display:'flex',justifyContent:'flex-end',gap:9,marginTop:20}}><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={saving||Number(target)<=0||!name.trim()} onClick={()=>onSave({name:name.trim(),target_amount:Number(target),target_date:date||null})}>{saving?'Saving…':'Save goal'}</button></div>
    </div>
  </div>;
}

function MoneyModal({open,onClose,onSave,goal,currency,mode,saving}){
  const [amount,setAmount]=useState('');
  const [method,setMethod]=useState('cash');
  useEffect(()=>{if(open){setAmount('');setMethod('cash');}},[open,goal]);
  if(!open)return null;
  return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}>
    <div className="card" style={{width:'min(420px,calc(100vw - 32px))',padding:24}}>
      <h2 style={{fontSize:19,marginBottom:5}}>{mode==='add'?'Add to':'Use from'} {goal.name}</h2>
      <p style={{fontSize:13,color:'var(--text-faint)',marginBottom:18}}>{mode==='add'?'This creates a real Wallet savings transaction.':'This uses money already assigned to this goal.'}</p>
      <label style={{fontSize:13,fontWeight:600}}>Amount<input className="input" style={{display:'block',width:'100%',marginTop:7}} type="number" min="1" step="1" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="5000" required autoFocus/></label>
      <label style={{display:'block',fontSize:13,fontWeight:600,marginTop:14}}>{mode==='add'?'Save from':'Return to'}<select className="input" style={{display:'block',width:'100%',marginTop:7}} value={method} onChange={e=>setMethod(e.target.value)}><option value="cash">Cash</option><option value="online">Online</option></select></label>
      <div style={{display:'flex',justifyContent:'flex-end',gap:9,marginTop:20}}><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={saving||Number(amount)<=0} onClick={()=>onSave(Number(amount),method)}>{saving?'Saving…':mode==='add'?'Add savings':'Use savings'}</button></div>
    </div>
  </div>;
}

export default function GoalsPage(){
  const {user,loading}=useAuth();
  const router=useRouter();
  const [goals,setGoals]=useState([]);
  const [transactions,setTransactions]=useState([]);
  const [loadingData,setLoadingData]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const [goalModal,setGoalModal]=useState({open:false,goal:null});
  const [moneyModal,setMoneyModal]=useState({open:false,goal:null,mode:'add'});

  useEffect(()=>{if(!loading&&!user)router.replace('/signin');},[loading,user,router]);
  useEffect(()=>{
    if(!user)return;
    let active=true;
    (async()=>{
      setLoadingData(true);setError('');
      const [{data:g,error:ge},{data:t,error:te}]=await Promise.all([
        supabase.from('wallet_goals').select('*').eq('user_id',user.id).order('target_date',{ascending:true,nullsFirst:false}).order('created_at',{ascending:true}),
        supabase.from('wallet_transactions').select('id,type,amount,date,category,method,destination,details,created_at').eq('user_id',user.id).in('type',['savings_add','savings_use']).order('date',{ascending:true}),
      ]);
      if(!active)return;
      if(ge||te)setError(ge?.message||te?.message||'Could not load savings goals.');
      setGoals(g||[]);setTransactions(t||[]);setLoadingData(false);
    })();
    return()=>{active=false;};
  },[user]);

  const currency=user?.user_metadata?.currency||'PKR';
  const goalStats=useMemo(()=>Object.fromEntries(goals.map(goal=>{
    let current=0;
    for(const tx of transactions){
      const details=tx.details&&typeof tx.details==='object'?tx.details:{};
      if(String(details.goal_id||'')!==String(goal.id))continue;
      const amount=Number(tx.amount)||0;
      if(tx.type==='savings_add')current+=amount;
      if(tx.type==='savings_use')current-=amount;
    }
    current=Math.max(0,current);
    const target=Number(goal.target_amount)||0;
    return [goal.id,{current,target,remaining:Math.max(0,target-current),percent:target?Math.min(100,Math.round(current/target*100)):0}];
  })),[goals,transactions]);

  async function saveGoal(payload){
    setSaving(true);setError('');
    const result=goalModal.goal
      ? await supabase.from('wallet_goals').update(payload).eq('id',goalModal.goal.id).eq('user_id',user.id).select('*').single()
      : await supabase.from('wallet_goals').insert({...payload,user_id:user.id}).select('*').single();
    setSaving(false);
    if(result.error){setError(result.error.message||'Could not save this goal.');return;}
    setGoals(prev=>goalModal.goal?prev.map(g=>g.id===goalModal.goal.id?result.data:g):[...prev,result.data]);
    setGoalModal({open:false,goal:null});
  }

  async function deleteGoal(goal){
    const linked=transactions.some(t=>String((t.details||{}).goal_id||'')===String(goal.id));
    if(linked){setError('This goal has Wallet savings history. Keep it so your historical savings remain intact.');return;}
    setSaving(true);setError('');
    const {error:e}=await supabase.from('wallet_goals').delete().eq('id',goal.id).eq('user_id',user.id);
    setSaving(false);
    if(e){setError(e.message||'Could not delete this goal.');return;}
    setGoals(prev=>prev.filter(g=>g.id!==goal.id));
  }

  async function saveMoney(amount,method){
    const goal=moneyModal.goal;if(!goal||amount<=0)return;
    const current=goalStats[goal.id]?.current||0;
    if(moneyModal.mode==='use'&&amount>current){setError(`You can use at most ${money(current,currency)} from this goal.`);return;}
    setSaving(true);setError('');
    const type=moneyModal.mode==='add'?'savings_add':'savings_use';
    const payload={user_id:user.id,type,amount,date:new Date().toISOString().slice(0,10),category:goal.name,method:moneyModal.mode==='add'?method:null,destination:moneyModal.mode==='use'?method:null,source:goal.name,notes:`Savings goal: ${goal.name}`,repay_required:true,details:{goal_id:goal.id,goal_name:goal.name}};
    const {data,error:e}=await supabase.from('wallet_transactions').insert(payload).select('*').single();
    setSaving(false);
    if(e){setError(e.message||'Could not save this savings transaction.');return;}
    setTransactions(prev=>[...prev,data]);
    setMoneyModal({open:false,goal:null,mode:'add'});
  }

  if(loading||!user)return <main style={{padding:60,textAlign:'center',color:'var(--text-faint)'}}>Loading…</main>;
  return <main className="container" style={{padding:'36px 24px 56px'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:16,flexWrap:'wrap',marginBottom:25}}>
      <div><button className="btn btn-ghost" style={{marginBottom:10}} onClick={()=>router.push('/dashboard')}>← Dashboard</button><h1 style={{fontSize:27,fontWeight:750,marginBottom:6}}>Savings Goals</h1><p style={{fontSize:14,color:'var(--text-faint)'}}>Give your savings a purpose and track progress from real Wallet savings.</p></div>
      <button className="btn btn-primary" onClick={()=>setGoalModal({open:true,goal:null})}>+ New goal</button>
    </div>
    {error&&<div className="card" style={{padding:14,marginBottom:18,borderColor:'var(--danger)',color:'var(--danger)',fontSize:13}}>{error}</div>}
    {loadingData?<div className="card" style={{padding:30,textAlign:'center',color:'var(--text-faint)'}}>Loading goals…</div>:!goals.length?<div className="card" style={{padding:36,textAlign:'center'}}><div style={{fontSize:30,marginBottom:10}}>◎</div><h2 style={{fontSize:18,marginBottom:6}}>No savings goals yet</h2><p style={{fontSize:13,color:'var(--text-faint)',marginBottom:16}}>Create your first goal — laptop, trip, emergency fund, anything you are saving toward.</p><button className="btn btn-primary" onClick={()=>setGoalModal({open:true,goal:null})}>Create first goal</button></div>:<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:14}}>{goals.map(goal=>{const s=goalStats[goal.id]||{current:0,target:Number(goal.target_amount),remaining:Number(goal.target_amount),percent:0};const complete=s.current>=s.target;return <div className="card" key={goal.id} style={{padding:20}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:10}}><div><h2 style={{fontSize:17,marginBottom:4}}>{goal.name}</h2><div style={{fontSize:13,color:'var(--text-faint)'}}>{goal.target_date?`Target: ${new Date(goal.target_date+'T00:00:00').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})`:'No deadline'}</div></div><button className="btn btn-ghost" style={{padding:'6px 9px',fontSize:12}} onClick={()=>setGoalModal({open:true,goal})}>Edit</button></div>
      <div style={{marginTop:20,display:'flex',justifyContent:'space-between',alignItems:'baseline'}}><strong style={{fontSize:20}}>{money(s.current,currency)}</strong><span style={{fontSize:13,color:'var(--text-faint)'}}>of {money(s.target,currency)}</span></div>
      <div style={{height:9,borderRadius:99,background:'var(--surface-2)',overflow:'hidden',marginTop:10}}><div style={{height:'100%',width:s.percent+'%',background:complete?'var(--success)':'var(--signal)',borderRadius:99}}/></div>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--text-faint)',marginTop:8}}><span>{s.percent}% complete</span><span>{complete?'Goal reached':`${money(s.remaining,currency)} remaining`}</span></div>
      <div style={{display:'flex',gap:8,marginTop:18}}><button className="btn btn-primary" style={{flex:1}} onClick={()=>setMoneyModal({open:true,goal,mode:'add'})}>+ Add money</button><button className="btn btn-ghost" style={{flex:1}} disabled={!s.current} onClick={()=>setMoneyModal({open:true,goal,mode:'use'})}>Use savings</button></div>
      {!s.current&&<button onClick={()=>deleteGoal(goal)} disabled={saving} style={{border:0,background:'none',padding:0,marginTop:13,color:'var(--text-faint)',fontSize:12,cursor:'pointer'}}>Delete goal</button>}
    </div>})}</div>}
    <GoalModal open={goalModal.open} initial={goalModal.goal} onClose={()=>setGoalModal({open:false,goal:null})} onSave={saveGoal} saving={saving}/>
    <MoneyModal open={moneyModal.open} goal={moneyModal.goal} mode={moneyModal.mode} currency={currency} onClose={()=>setMoneyModal({open:false,goal:null,mode:'add'})} onSave={saveMoney} saving={saving}/>
  </main>;
}

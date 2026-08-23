'use client';

import {useEffect,useMemo,useState} from 'react';
import {useRouter} from 'next/navigation';
import {useAuth} from '@/components/AuthProvider';
import {supabase} from '@/lib/supabaseClient';
import {stats,money,monthLabel} from '@/lib/wallet/calc';
import Assistant from '@/components/assistant/Assistant';

const TOOLS=[
  {icon:'💳',name:'Expense tracker',desc:'Track spending and balances.',href:'/dashboard/expense-tracker',ready:true},
  {icon:'📊',name:'Budget planner',desc:'Set category limits and compare them with real spending.',href:'/dashboard/budget',ready:true},
  {icon:'🐖',name:'Savings goals',desc:'Save toward specific goals with a target and deadline.',href:'/dashboard/goals',ready:true},
  {icon:'🧾',name:'Bill & subscription reminders',desc:'Track recurring bills and upcoming due dates.',href:'/dashboard/bills',ready:true}
];

function SummaryCard({label,value,sub,tone=''}){
  return <div className={`card dashboard-summary-card ${tone}`}>
    <div className="dashboard-summary-label">{label}</div>
    <strong>{value}</strong>
    <span>{sub}</span>
  </div>;
}

function DashboardSnapshot({user,currency}){
  const [transactions,setTransactions]=useState([]);
  const [loading,setLoading]=useState(true);
  const month=useMemo(()=>new Date().toISOString().slice(0,7),[]);

  useEffect(()=>{
    let active=true;
    (async()=>{
      setLoading(true);
      const {data,error}=await supabase
        .from('wallet_transactions')
        .select('id,type,amount,date,category,method,source,person,notes,repay_required,from_account,destination,details,created_at,updated_at')
        .eq('user_id',user.id)
        .order('date',{ascending:true})
        .order('created_at',{ascending:true});
      if(active){
        setTransactions(error?[]:(data||[]).map(row=>({
          ...row,
          amount:Number(row.amount)||0,
          date:row.date,
          category:row.category||row.details?.category||'',
          method:row.method||row.details?.method||'',
          source:row.source||row.details?.source||'',
          person:row.person||row.details?.person||'',
          notes:row.notes||row.details?.notes||'',
          repayRequired:row.repay_required,
          from:row.from_account||row.details?.from||'',
          destination:row.destination||row.details?.destination||''
        })));
        setLoading(false);
      }
    })();
    return()=>{active=false;};
  },[user.id]);

  const s=useMemo(()=>stats(transactions,month),[transactions,month]);
  const recent=useMemo(()=>transactions.slice().sort((a,b)=>b.date.localeCompare(a.date)||String(b.created_at||'').localeCompare(String(a.created_at||''))).slice(0,5),[transactions]);

  if(loading)return <section className="dashboard-snapshot"><div className="dashboard-snapshot-head"><div><span className="wallet-section-kicker">FINANCIAL OVERVIEW</span><h2>Loading your finances…</h2></div></div><div className="dashboard-summary-grid"><div className="dashboard-summary-skeleton"/><div className="dashboard-summary-skeleton"/><div className="dashboard-summary-skeleton"/><div className="dashboard-summary-skeleton"/></div></section>;

  const netLabel=s.net>=0?'Positive cash flow':'Spending exceeded income';
  const savingsRate=s.income>0?Math.max(0,Math.min(100,(s.savingsAdded/s.income)*100)):0;

  return <section className="dashboard-snapshot">
    <div className="dashboard-snapshot-head">
      <div><span className="wallet-section-kicker">FINANCIAL OVERVIEW</span><h2>{monthLabel(month)}</h2><p>Your current month at a glance.</p></div>
      <a className="btn btn-primary" href="/dashboard/expense-tracker">Open wallet →</a>
    </div>

    <div className="dashboard-summary-grid">
      <SummaryCard label="Available spending" value={money(s.balances.available,currency)} sub="Cash + online" />
      <SummaryCard label="Income" value={money(s.income,currency)} sub={monthLabel(month)} tone="positive" />
      <SummaryCard label="Expenses" value={money(s.expenses,currency)} sub={monthLabel(month)} tone="negative" />
      <SummaryCard label="Savings" value={money(s.balances.savings,currency)} sub={`${savingsRate.toFixed(0)}% of income added`} tone="positive" />
    </div>

    <div className="dashboard-snapshot-lower">
      <div className="dashboard-flow-card">
        <div className="dashboard-flow-head"><div><span className="wallet-section-kicker">CASH FLOW</span><h3>{netLabel}</h3></div><strong className={s.net>=0?'positive':'negative'}>{money(s.net,currency)}</strong></div>
        <div className="dashboard-flow-bars">
          <div><span><b>Income</b><b>{money(s.income,currency)}</b></span><i><em style={{width:`${s.income>0?100:0}%`}}/></i></div>
          <div><span><b>Expenses</b><b>{money(s.expenses,currency)}</b></span><i><em style={{width:`${s.income>0?Math.min(100,(s.expenses/s.income)*100):0}%`}}/></i></div>
          <div><span><b>Savings added</b><b>{money(s.savingsAdded,currency)}</b></span><i><em style={{width:`${s.income>0?Math.min(100,(s.savingsAdded/s.income)*100):0}%`}}/></i></div>
        </div>
      </div>

      <div className="dashboard-recent-card">
        <div className="dashboard-flow-head"><div><span className="wallet-section-kicker">RECENT ACTIVITY</span><h3>Latest transactions</h3></div><a className="wallet-text-link" href="/dashboard/expense-tracker/transactions">View all →</a></div>
        {recent.length?<div className="dashboard-recent-list">{recent.map(t=><div key={t.id}><span><b>{t.category||t.source||t.type}</b><small>{t.date} · {t.method||'—'}</small></span><strong className={t.type==='expense'?'negative':t.type==='salary'||t.type==='income'?'positive':''}>{t.type==='expense'?'−':'+'}{money(t.amount,currency)}</strong></div>)}</div>:<div className="dashboard-empty-state"><div>💰</div><strong>No transactions yet</strong><span>Add your first income or expense to start tracking your money.</span><a className="btn btn-primary" href="/dashboard/expense-tracker">Add transaction</a></div>}
      </div>
    </div>
  </section>;
}

export default function DashboardPage(){
  const {user,loading}=useAuth();
  const router=useRouter();
  const [hasAdminAccess,setHasAdminAccess]=useState(false);
  useEffect(()=>{
    if(!loading&&!user)router.replace('/signin');
    if(user)supabase.rpc('is_editor_or_admin').then(({data})=>setHasAdminAccess(!!data));
  },[loading,user,router]);
  if(loading||!user)return <main style={{padding:60,textAlign:'center',color:'var(--text-faint)'}}>Loading…</main>;
  const fullName=user.user_metadata?.full_name?.trim();
  const firstName=fullName?.split(/\s+/)[0]||user.user_metadata?.username||user.email;
  const currency=user.user_metadata?.currency||'PKR';
  return <><main className="container dashboard-home" style={{padding:'48px 24px'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12,marginBottom:28}}>
      <div><h1 style={{fontSize:24,fontWeight:700,marginBottom:6}}>Welcome, {firstName}</h1><p style={{fontSize:14,color:'var(--text-faint)'}}>Your financial overview and tools are ready.</p></div>
      {hasAdminAccess&&<a href="/dashboard/admin" className="btn btn-primary">Admin panel</a>}
    </div>

    <DashboardSnapshot user={user} currency={currency}/>

    <div className="dashboard-tools-head"><div><span className="wallet-section-kicker">YOUR TOOLS</span><h2>Manage your money</h2></div></div>
    <div className="dashboard-card-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:14}}>{TOOLS.map(t=><a key={t.name} href={t.ready?t.href:undefined} className="card" style={{opacity:t.ready?1:.55,cursor:t.ready?'pointer':'default'}}><div style={{width:40,height:40,borderRadius:10,background:'var(--signal-tint)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:19,marginBottom:14}}>{t.icon}</div><div style={{fontWeight:600,fontSize:15,marginBottom:4}}>{t.name}</div><div style={{fontSize:13,color:'var(--text-faint)'}}>{t.desc}</div></a>)}</div>
  </main><Assistant/></>;
}

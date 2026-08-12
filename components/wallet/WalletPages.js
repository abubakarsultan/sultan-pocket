'use client';

import Link from 'next/link';
import {useMemo,useState} from 'react';
import {useRouter} from 'next/navigation';
import {useWallet} from './WalletProvider';
import {
  balances, money, monthLabel, monthOf, shiftMonth, stats, transactionLabel
} from '@/lib/wallet/calc';

function Actions({items}){
  const {notify,user}=useWallet();
  const run=(detail)=>{
    if(user) window.dispatchEvent(new CustomEvent('wallet:add',{detail}));
    else window.dispatchEvent(new CustomEvent('wallet:gate'));
  };
  return <section className="wallet-action-panel">
    <div className="wallet-panel-head action-panel-head">
      <div><span className="wallet-section-kicker">QUICK ACTIONS</span><h2>Manage your money</h2></div>
      <span>10 actions</span>
    </div>
    <div className="wallet-action-grid">
      {items.map(([kind,label,icon,detail])=>
        <button key={`${kind}-${label}`} className={`wallet-action-card action-${kind}`} onClick={()=>run(detail||kind)}>
          <span className="action-icon">{icon}</span>
          <span><b>{label}</b><small>{actionDescription(kind)}</small></span>
          <span className="action-arrow">→</span>
        </button>
      )}
    </div>
    {!user&&<small className="wallet-action-note">Guest mode is read-only. Sign in to add, edit, delete, or save transactions.</small>}
  </section>;
}
function actionDescription(kind){
  const d={
    income:'Record money received',
    expense:'Record a new expense',
    transfer:'Move money between balances',
    withdraw:'Move online money to cash',
    savings_add:'Set money aside',
    savings_use:'Return money from savings',
    etransit_add:'Top up transport wallet',
    transport:'Record transport spending',
    borrow:'Record money received as debt',
    repay:'Record a debt repayment'
  };
  return d[kind]||'Add a transaction';
}

function Card({label,value,sub,accent}){return <div className="wallet-card" style={{'--accent':accent||'var(--signal)'}}><small>{label}</small><strong>{value}</strong>{sub&&<span>{sub}</span>}</div>}

function DemoNotice(){
  const router=useRouter();
  return <div className="wallet-demo">
    <b>Guest browsing</b>
    <span>Explore the Wallet with demo data. Personal data and all write actions require an account.</span>
    <button className="wallet-btn primary" onClick={()=>router.push('/signin?next=/dashboard/wallet')}>Sign in</button>
  </div>;
}

function useData(){
  const {state,user,month,demoTransactions}=useWallet();
  const tx=user?state.transactions:demoTransactions;
  const s=stats(tx,month);
  return {user,tx,month,s,b:s.balances,state};
}

export function Dashboard(){return <Page title="Wallet overview"><DashboardInner/></Page>}

function DashboardInner(){
  const {user,tx,month,s,b}=useData();
  const recent=tx.slice().sort((a,b)=>b.date.localeCompare(a.date)||Number(b.id)-Number(a.id)).slice(0,8);
  const incomeCats=Object.entries(s.incomeByCategory);
  const expenseCats=Object.entries(s.byCategory);
  const actions=[
    ['income','Add Income','+'],
    ['expense','Add Expense','−'],
    ['transfer','Cash ↔ Online Transfer','⇄'],
    ['withdraw','Withdraw Online → Cash','↓'],
    ['savings_add','Add Savings','◒'],
    ['savings_use','Use Savings','↑'],
    ['etransit_add','Add to E-Transit','◉'],
    ['transport','Transport Expense','↗',{type:'expense',category:'Transport',method:'etransit'}],
    ['borrow','Borrow Money','↙'],
    ['repay','Repay Money','↗']
  ];
  return <>
    <Actions items={actions}/>
    <div className="wallet-grid four">
      <Card label="Available spending" value={money(b.available)} sub="Cash + online"/>
      <Card label="Cash balance" value={money(b.cash)} sub="Physical cash"/>
      <Card label="Online balance" value={money(b.online)} sub="Bank / digital"/>
      <Card label="Savings" value={money(b.savings)} sub="Money set aside" accent="var(--success)"/>
      <Card label="E-Transit wallet" value={money(b.etransit)} sub="Transport balance" accent="#8656C4"/>
      <Card label="Money owed" value={money(b.owed)} sub="Outstanding borrowing" accent="var(--danger)"/>
      <Card label="Total money" value={money(b.total)} sub="Cash + online + savings + E-Transit"/>
      <Card label="Expenses this month" value={money(s.expenses)} sub={monthLabel(month)} accent="var(--danger)"/>
    </div>

    <div className="wallet-grid two">
      <section className="wallet-panel">
        <div className="wallet-panel-head"><div><span className="wallet-section-kicker">MONTHLY OVERVIEW</span><h2>{monthLabel(month)}</h2></div><span>{s.net>=0?'Positive month':'Spending exceeded income'}</span></div>
        <div className="metric-list">
          <div><span>Opening balance</span><b>{money(s.openingBalances.total)}</b></div>
          <div><span>Income</span><b className="positive">{money(s.income)}</b></div>
          <div><span>Expenses</span><b className="negative">{money(s.expenses)}</b></div>
          <div><span>Net cash flow</span><b className={s.net>=0?'positive':'negative'}>{money(s.net)}</b></div>
          <div><span>Savings added</span><b>{money(s.savingsAdded)}</b></div>
          <div><span>Savings used</span><b>{money(s.savingsUsed)}</b></div>
          <div><span>Transport</span><b>{money(s.transport)}</b></div>
          <div><span>Borrowed / repaid</span><b>{money(s.borrowed)} / {money(s.repaid)}</b></div>
          <div><span>Closing balance</span><b>{money(s.closingBalances.total)}</b></div>
        </div>
      </section>

      <section className="wallet-panel">
        <div className="wallet-panel-head">
          <div><span className="wallet-section-kicker">RECENT ACTIVITY</span><h2>Recent transactions</h2></div>
          <Link className="wallet-text-link" href="/dashboard/wallet/transactions">View all →</Link>
        </div>
        <TxTable tx={recent} empty="No transactions yet."/>
      </section>
    </div>

    <div className="wallet-grid two">
      <CategorySummary title="Income breakdown" data={incomeCats} positive/>
      <CategorySummary title="Expense breakdown" data={expenseCats}/>
    </div>

    <section className="wallet-panel carry-forward">
      <div>
        <span className="wallet-section-kicker">CARRY FORWARD</span>
        <h2>{monthLabel(month)} opening balance</h2>
        <p>Previous month closing balances are automatically carried into the selected month.</p>
      </div>
      <div className="carry-values">
        <span>Cash <b>{money(s.openingBalances.cash)}</b></span>
        <span>Online <b>{money(s.openingBalances.online)}</b></span>
        <strong>{money(s.openingBalances.total)}</strong>
      </div>
    </section>
  </>;
}

function CategorySummary({title,data,positive}){
  const max=Math.max(1,...data.map(([,v])=>Number(v)||0));
  return <section className="wallet-panel">
    <div className="wallet-panel-head"><h2>{title}</h2><span>{data.length} categories</span></div>
    {data.length?data.map(([k,v])=>
      <div className="bar" key={k}>
        <div><span>{k}</span><b className={positive?'positive':''}>{money(v)}</b></div>
        <i><em className={positive?'income-bar':''} style={{width:`${(Number(v)||0)/max*100}%`}}/></i>
      </div>
    ):<div className="wallet-empty">No data for this month.</div>}
  </section>;
}

export function Transactions(){return <Page title="Transactions"><TransactionsInner/></Page>}

function TransactionsInner(){
  const {user,tx}=useData();
  const [search,setSearch]=useState('');
  const [type,setType]=useState('all');
  const [category,setCategory]=useState('all');
  const [method,setMethod]=useState('all');
  const [person,setPerson]=useState('');
  const [filterMonth,setFilterMonth]=useState('all');

  const categories=[...new Set(tx.map(t=>t.category).filter(Boolean))].sort();
  const types=[...new Set(tx.map(t=>t.type))].sort();
  const months=[...new Set(tx.map(t=>monthOf(t.date)))].sort().reverse();

  const filtered=useMemo(()=>tx.filter(t=>{
    const q=search.toLowerCase().trim();
    const matchesSearch=!q||[t.category,t.source,t.person,t.notes,t.type,t.method].some(v=>String(v||'').toLowerCase().includes(q));
    return matchesSearch
      &&(type==='all'||t.type===type)
      &&(category==='all'||t.category===category)
      &&(method==='all'||(t.method||t.from)===method)
      &&(filterMonth==='all'||monthOf(t.date)===filterMonth)
      &&(!person||String(t.person||'').toLowerCase().includes(person.toLowerCase()));
  }),[tx,search,type,category,method,filterMonth,person]);

  function reset(){setSearch('');setType('all');setCategory('all');setMethod('all');setPerson('');setFilterMonth('all');}

  return <section className="wallet-panel">
    <div className="wallet-panel-head">
      <div><span className="wallet-section-kicker">LEDGER</span><h2>All transactions</h2></div>
      <div className="wallet-panel-tools">
        <span>{filtered.length} shown</span>
        {user&&<button className="wallet-btn export-btn" onClick={()=>exportCSV(filtered)}>↓ Export CSV</button>}
      </div>
    </div>
    <div className="wallet-filters">
      <input placeholder="Search transactions…" value={search} onChange={e=>setSearch(e.target.value)}/>
      <select value={filterMonth} onChange={e=>setFilterMonth(e.target.value)}><option value="all">All months</option>{months.map(m=><option key={m} value={m}>{monthLabel(m)}</option>)}</select>
      <select value={type} onChange={e=>setType(e.target.value)}><option value="all">All types</option>{types.map(t=><option key={t} value={t}>{transactionLabel({type:t})}</option>)}</select>
      <select value={category} onChange={e=>setCategory(e.target.value)}><option value="all">All categories</option>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select>
      <select value={method} onChange={e=>setMethod(e.target.value)}><option value="all">All methods</option><option value="cash">Cash</option><option value="online">Online</option><option value="etransit">E-Transit Wallet</option></select>
      <input placeholder="Filter by person" value={person} onChange={e=>setPerson(e.target.value)}/>
      <button className="wallet-btn secondary" onClick={reset}>Reset filters</button>
    </div>
    {!user&&<div className="wallet-readonly-note">Guest transactions are demo data and cannot be edited or deleted.</div>}
    <TxTable tx={filtered.slice().sort((a,b)=>b.date.localeCompare(a.date)||Number(b.id)-Number(a.id))} empty="No transactions match your filters."/>
  </section>;
}

function TxTable({tx,empty}){
  const {remove,user}=useWallet();
  const [confirmId,setConfirmId]=useState(null);
  if(!tx.length)return <div className="wallet-empty">{empty}</div>;
  const confirmTx=tx.find(t=>t.id===confirmId);
  return <>
    <div className="wallet-table-wrap">
      <table className="wallet-table">
        <thead><tr><th>Date</th><th>Type</th><th>Details</th><th>Method</th><th>Amount</th><th>Actions</th></tr></thead>
        <tbody>{tx.map(t=>
          <tr key={t.id}>
            <td>{t.date}</td>
            <td><span className={`wallet-pill pill-${t.type}`}>{transactionLabel(t)}</span></td>
            <td>{t.category||t.source||t.person||t.notes||'—'}{t.person&&<small className="table-sub">{t.person}</small>}</td>
            <td>{displayMethod(t.method||t.from)}</td>
            <td className={['salary','income_other','borrow','savings_use'].includes(t.type)?'positive':'negative'}>{money(t.amount)}</td>
            <td><div className="table-actions">
              {user&&<><button className="table-action edit" onClick={()=>window.dispatchEvent(new CustomEvent('wallet:edit',{detail:t}))}>Edit</button><button className="table-action delete" onClick={()=>setConfirmId(t.id)}>Delete</button></>}
              {!user&&<span className="table-locked">Read only</span>}
            </div></td>
          </tr>
        )}</tbody>
      </table>
    </div>
    {confirmId!==null&&<ConfirmDelete transaction={confirmTx} close={()=>setConfirmId(null)} confirm={async()=>{await remove(confirmId);setConfirmId(null)}}/>}
  </>;
}

function ConfirmDelete({transaction,close,confirm}){
  const [busy,setBusy]=useState(false);
  async function go(){setBusy(true);await confirm();setBusy(false);}
  return <div className="gate-backdrop"><div className="confirm-modal">
    <div className="confirm-icon">!</div>
    <span className="wallet-modal-kicker">DELETE TRANSACTION</span>
    <h2>Delete this transaction?</h2>
    <p>This cannot be undone. {transaction?.category||transaction?.source||transactionLabel(transaction)} · {money(transaction?.amount)}</p>
    <div className="confirm-actions"><button className="wallet-btn secondary" onClick={close} disabled={busy}>Cancel</button><button className="wallet-btn danger-fill" onClick={go} disabled={busy}>{busy?'Deleting…':'Yes, delete'}</button></div>
  </div></div>;
}

function displayMethod(method){
  return {cash:'Cash',online:'Online',etransit:'E-Transit Wallet'}[method]||'—';
}
function exportCSV(tx){
  const headers=['Date','Type','Amount','Category','Source','Method','Person','Notes'];
  const rows=tx.map(t=>[t.date,transactionLabel(t),t.amount,t.category||'',t.source||'',displayMethod(t.method||t.from),t.person||'',t.notes||'']);
  const csv=[headers,...rows].map(row=>row.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n');
  const blob=new Blob([`\ufeff${csv}`],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=`sultan-pocket-transactions-${new Date().toISOString().slice(0,10)}.csv`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
}

export function Transport(){return <Page title="Transport"><TransportInner/></Page>}
function TransportInner(){
  const {user,s}=useData();
  const transitUsed=s.tx.filter(t=>t.type==='expense'&&t.method==='etransit').reduce((a,t)=>a+(Number(t.amount)||0),0);
  const otherTransport=s.tx.filter(t=>t.type==='expense'&&t.category==='Transport'&&t.method!=='etransit').reduce((a,t)=>a+(Number(t.amount)||0),0);
  const topups=s.tx.filter(t=>t.type==='etransit_add').reduce((a,t)=>a+(Number(t.amount)||0),0);
  return <><Actions items={[['etransit_add','Add to E-Transit','◉'],['transport','Add Transport Expense','↗',{type:'expense',category:'Transport',method:'etransit'}]]}/>
    <div className="wallet-grid four"><Card label="Transport this month" value={money(s.transport)}/><Card label="E-Transit used" value={money(transitUsed)} accent="#8656C4"/><Card label="Other transport" value={money(otherTransport)}/><Card label="Top-ups" value={money(topups)} accent="var(--success)"/></div>
    <section className="wallet-panel"><div className="wallet-panel-head"><h2>Transport activity</h2><span>{user?'Your data':'Demo data'}</span></div><TxTable tx={s.tx.filter(t=>t.category==='Transport'||t.type==='etransit_add').sort((a,b)=>b.date.localeCompare(a.date))} empty="No transport activity this month."/></section>
  </>;
}

export function Savings(){return <Page title="Savings"><SavingsInner/></Page>}
function SavingsInner(){
  const {s,b}=useData();
  return <><Actions items={[['savings_add','Add Savings','◒'],['savings_use','Use Savings','↑']]}/>
    <div className="wallet-grid four"><Card label="Savings balance" value={money(b.savings)} accent="var(--success)"/><Card label="Added this month" value={money(s.savingsAdded)}/><Card label="Used this month" value={money(s.savingsUsed)} accent="var(--danger)"/><Card label="Available to spend" value={money(b.available)}/></div>
    <section className="wallet-panel"><h2>Savings activity</h2><TxTable tx={s.tx.filter(t=>t.type.startsWith('savings_')).sort((a,b)=>b.date.localeCompare(a.date))} empty="No savings activity this month."/></section>
  </>;
}

export function Debt(){return <Page title="Debt & Borrowing"><DebtInner/></Page>}
function DebtInner(){
  const {s,b}=useData();
  const people=Object.entries(s.debtByPerson);
  return <><Actions items={[['borrow','Borrow Money','↙'],['repay','Repay Money','↗']]}/>
    <div className="wallet-grid three"><Card label="Still owed" value={money(b.owed)} accent="var(--danger)"/><Card label="Borrowed total" value={money(s.borrowed)}/><Card label="Repaid total" value={money(s.repaid)} accent="var(--success)"/></div>
    <section className="wallet-panel"><div className="wallet-panel-head"><h2>Outstanding by person</h2><span>{people.length} people</span></div>
      {people.length?<div className="debt-list">{people.map(([person,v])=><div className="debt-row" key={person}><div><strong>{person}</strong><span>Borrowed {money(v.borrowed)} · Repaid {money(v.repaid)}</span></div><b className={v.remaining?'negative':'positive'}>{v.remaining?money(v.remaining)+' remaining':'Paid'}</b></div>)}</div>:<div className="wallet-empty">No debt activity yet.</div>}
    </section>
    <section className="wallet-panel"><h2>Borrowing & repayments this month</h2><TxTable tx={s.tx.filter(t=>t.type==='borrow'||t.type==='repay').sort((a,b)=>b.date.localeCompare(a.date))} empty="No debt activity this month."/></section>
  </>;
}

export function Charts(){return <Page title="Charts & statistics"><ChartsInner/></Page>}
function ChartsInner(){
  const {tx,month,s}=useData();
  const history=Array.from({length:6},(_,i)=>shiftMonth(month,i-5)).map(m=>({...stats(tx,m),month:m}));
  const expenseCats=Object.entries(s.byCategory);
  const incomeCats=Object.entries(s.incomeByCategory);
  const maxSpend=Math.max(1,...history.map(x=>x.expenses));
  const maxSave=Math.max(1,...history.map(x=>x.savingsAdded));
  return <>
    <div className="wallet-chart-grid">
      <ChartBars title="Income vs expenses · last 6 months" items={history.map(x=>({label:shortMonth(x.month),a:x.income,b:x.expenses}))} aLabel="Income" bLabel="Expenses"/>
      <ChartBars title="Savings added · last 6 months" items={history.map(x=>({label:shortMonth(x.month),a:x.savingsAdded,b:0}))} aLabel="Savings" bLabel=""/>
      <CategorySummary title="Expenses by category" data={expenseCats}/>
      <CategorySummary title="Income by category" data={incomeCats} positive/>
    </div>
    <section className="wallet-panel"><div className="wallet-panel-head"><h2>Balance distribution</h2><span>{monthLabel(month)} closing</span></div><div className="distribution"><BalanceStat label="Cash" value={s.balances.cash}/><BalanceStat label="Online" value={s.balances.online}/><BalanceStat label="Savings" value={s.balances.savings}/><BalanceStat label="E-Transit" value={s.balances.etransit}/></div></section>
    <div className="wallet-chart-grid">
      <ChartBars title="Transport spending · last 6 months" items={history.map(x=>({label:shortMonth(x.month),a:x.transport,b:0}))} aLabel="Transport" bLabel=""/>
      <ChartBars title="Savings balance · last 6 months" items={history.map(x=>({label:shortMonth(x.month),a:x.balances.savings,b:0}))} aLabel="Savings balance" bLabel=""/>
    </div>
    <section className="wallet-panel"><h2>Chart scale</h2><p className="chart-note">Highest monthly expense: {money(maxSpend)} · Highest monthly savings added: {money(maxSave)}. Charts use the selected month and the five preceding months.</p></section>
  </>;
}
function shortMonth(m){return new Date(`${m}-01T00:00:00`).toLocaleString('en-US',{month:'short'});}
function ChartBars({title,items,aLabel,bLabel}){
  const max=Math.max(1,...items.map(x=>Math.max(Number(x.a)||0,Number(x.b)||0)));
  return <section className="wallet-panel"><div className="wallet-panel-head"><h2>{title}</h2><span>{aLabel}{bLabel?' · '+bLabel:''}</span></div>
    <div className="chart-bars">{items.map(x=><div className="chart-col" key={x.label}><div className="chart-values"><i style={{height:`${Math.max(4,(Number(x.a)||0)/max*100)}%`}} title={`${aLabel}: ${money(x.a)}`}></i>{bLabel&&<em style={{height:`${Math.max(4,(Number(x.b)||0)/max*100)}%`}} title={`${bLabel}: ${money(x.b)}`}></em>}</div><span>{x.label}</span></div>)}</div>
  </section>;
}
function BalanceStat({label,value}){return <div className="balance-stat"><span>{label}</span><strong>{money(value)}</strong></div>}

function Page({title,children}){
  const {user}=useWallet();
  return <div className="wallet-page">
    <div className="wallet-page-title"><div><span>WALLET</span><h2>{title}</h2></div></div>
    {!user&&<DemoNotice/>}
    {children}
  </div>;
}

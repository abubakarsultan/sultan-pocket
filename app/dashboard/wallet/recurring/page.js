'use client';

import {useMemo,useState} from 'react';
import {useWallet} from '@/components/wallet/WalletProvider';
import {money,transactionLabel,DEFAULT_EXPENSE_CATEGORIES,DEFAULT_INCOME_CATEGORIES,TYPES} from '@/lib/wallet/calc';

const BASE={type:'expense',amount:'',day_of_month:'1',category:'Food',method:'cash',source:'',person:'',notes:'',active:true};

export default function RecurringPage(){
  const {user,state,currency,addRecurring,updateRecurring,removeRecurring,saving}=useWallet();
  const rules=state?.recurringRules||[];
  const [form,setForm]=useState(BASE);
  const [editingId,setEditingId]=useState(null);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');

  const categories=useMemo(()=>{
    if(form.type==='salary'||form.type==='income_other')return DEFAULT_INCOME_CATEGORIES;
    return DEFAULT_EXPENSE_CATEGORIES;
  },[form.type]);

  const set=(k,v)=>setForm(x=>({...x,[k]:v}));

  function edit(rule){
    setEditingId(rule.id);
    setForm({...BASE,...rule,amount:String(rule.amount),day_of_month:String(rule.day_of_month)});
    setError('');setNotice('');
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function reset(){
    setEditingId(null);
    setForm(BASE);
    setError('');
  }

  async function save(e){
    e.preventDefault();setError('');setNotice('');
    const amount=Number(form.amount);
    const day=Number(form.day_of_month);
    if(!amount||amount<=0){setError('Enter a valid amount.');return;}
    if(day<1||day>28){setError('Day of month must be between 1 and 28.');return;}
    const payload={...form,amount,day_of_month:day,active:form.active!==false};
    const ok=editingId?await updateRecurring(editingId,payload):await addRecurring(payload);
    if(ok){setNotice(editingId?'Recurring rule updated.':'Recurring rule created.');reset();}
  }

  async function toggle(rule){
    await updateRecurring(rule.id,{active:!rule.active});
  }

  async function remove(rule){
    if(window.confirm(`Delete the recurring rule for ${money(rule.amount,currency)}?`))await removeRecurring(rule.id);
  }

  if(!user)return <section className="wallet-panel"><h2>Recurring transactions</h2><p className="chart-note">Sign in to create and manage recurring rules.</p></section>;

  return <div className="recurring-page">
    <section className="wallet-panel recurring-form-panel">
      <div className="wallet-panel-head">
        <div><span className="wallet-section-kicker">RECURRING</span><h2>{editingId?'Edit recurring rule':'Create recurring rule'}</h2></div>
      </div>
      {error&&<div className="wallet-notice error">{error}</div>}
      {notice&&<div className="wallet-notice success">{notice}</div>}
      <form className="wallet-form-grid recurring-form" onSubmit={save}>
        <label>Type
          <select value={form.type} onChange={e=>set('type',e.target.value)}>
            {Object.entries(TYPES).map(([value,label])=><option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>Amount
          <input type="number" min="1" step="0.01" inputMode="decimal" value={form.amount} onChange={e=>set('amount',e.target.value)} required/>
        </label>
        <label>Day of month
          <input type="number" min="1" max="28" value={form.day_of_month} onChange={e=>set('day_of_month',e.target.value)} required/>
        </label>
        {(form.type==='salary'||form.type==='income_other'||form.type==='expense')&&<label>Category
          <select value={categories.includes(form.category)?form.category:''} onChange={e=>set('category',e.target.value)}>
            {categories.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </label>}
        {['salary','income_other','expense','borrow','repay','savings_add'].includes(form.type)&&<label>Method
          <select value={form.method} onChange={e=>set('method',e.target.value)}>
            <option value="cash">Cash</option><option value="online">Online</option>
            {form.type==='expense'&&<option value="etransit">E-Transit Wallet</option>}
          </select>
        </label>}
        {['borrow','repay'].includes(form.type)&&<label>Person
          <input value={form.person} onChange={e=>set('person',e.target.value)} placeholder="Person name"/>
        </label>}
        <label className="full">Notes
          <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Optional note"/>
        </label>
        <div className="full recurring-form-actions">
          <button type="button" className="wallet-btn secondary" onClick={reset} disabled={saving}>{editingId?'Cancel':'Reset'}</button>
          <button className="wallet-btn primary" disabled={saving}>{editingId?'Update rule':'Save rule'}</button>
        </div>
      </form>
    </section>

    <section className="wallet-panel">
      <div className="wallet-panel-head"><div><span className="wallet-section-kicker">RULES</span><h2>Your recurring rules</h2></div><span>{rules.length} rules</span></div>
      {!rules.length?<div className="wallet-empty">No recurring rules yet.</div>:<div className="recurring-list">
        {rules.map(rule=><article className={`recurring-row ${rule.active?'':'inactive'}`} key={rule.id}>
          <div className="recurring-main">
            <span className={`wallet-pill pill-${rule.type}`}>{transactionLabel(rule)}</span>
            <strong>{money(rule.amount,currency)}</strong>
            <small>Every month on day {rule.day_of_month}{rule.category?` · ${rule.category}`:''}{rule.method?` · ${rule.method}`:''}</small>
          </div>
          <div className="recurring-actions">
            <button className="table-action" onClick={()=>toggle(rule)}>{rule.active?'Deactivate':'Activate'}</button>
            <button className="table-action edit" onClick={()=>edit(rule)}>Edit</button>
            <button className="table-action delete" onClick={()=>remove(rule)}>Delete</button>
          </div>
        </article>)}
      </div>}
    </section>
  </div>;
}

'use client';
import {useEffect,useMemo,useState} from 'react';
import {useWallet} from './WalletProvider';

const BASE={type:'expense',amount:'',date:new Date().toISOString().slice(0,10),category:'Food',method:'cash',source:'',person:'',notes:'',repayRequired:true,from:'cash',destination:'cash'};
const TITLES={income:'Income',expense:'Expense',transfer:'Transfer',withdraw:'Withdraw Cash',etransit_add:'Add E-Transit',savings_add:'Add Savings',savings_use:'Use Savings',borrow:'Borrow Money',repay:'Repay Money'};
const EXPENSE=['Transport','Food','Shopping','Bills','Entertainment','Education','Personal','Other'];
const INCOME=['Monthly Stipend','Family','Other Income'];
const today=()=>new Date().toISOString().slice(0,10);
function normalizeType(t){return t==='income_other'||t==='stipend'?'income':t}
export default function WalletModal(){
 const {user,add,update,addCategory,state}=useWallet();
 const [open,setOpen]=useState(false),[kind,setKind]=useState('expense'),[editingId,setEditingId]=useState(null),[form,setForm]=useState({...BASE}),[busy,setBusy]=useState(false),[newCategory,setNewCategory]=useState('');
 useEffect(()=>{
  function handleAdd(e){if(!user)return;const detail=e.detail||'expense';const nextKind=typeof detail==='string'?detail:detail.type||'expense';setEditingId(null);setKind(nextKind);setNewCategory('');setForm({...BASE,...(typeof detail==='object'?detail:{}),type:nextKind,date:today(),category:nextKind==='income'?'Monthly Stipend':nextKind==='expense'?(detail?.category||'Food'):'Food'});setOpen(true)}
  function handleEdit(e){if(!user||!e.detail)return;const t=e.detail,k=normalizeType(t.type);setEditingId(t.id);setKind(k);setNewCategory('');setForm({...BASE,...t,type:k,amount:String(t.amount??''),date:t.date||today(),category:t.category||(k==='income'?'Other Income':'Food'),method:t.method||'cash',from:t.from||'cash',destination:t.destination||'cash',repayRequired:t.repayRequired!==false});setOpen(true)}
  window.addEventListener('wallet:add',handleAdd);window.addEventListener('wallet:edit',handleEdit);return()=>{window.removeEventListener('wallet:add',handleAdd);window.removeEventListener('wallet:edit',handleEdit)}
 },[user]);
 const custom=state?.customCategories||[];
 const categories=useMemo(()=>{const defaults=kind==='income'?INCOME:EXPENSE;const customForKind=custom.filter(c=>c.type===kind).map(c=>c.name);return [...new Set([...defaults,...customForKind])] },[custom,kind]);
 if(!open)return null;
 const setField=(f,v)=>setForm(c=>({...c,[f]:v}));
 async function saveCategory(){const name=newCategory.trim();if(!name)return;const saved=await addCategory(name,kind==='income'?'income':'expense');if(saved){setField('category',name);setNewCategory('')}}
 async function submit(e){e.preventDefault();if(!form.amount||Number(form.amount)<=0)return;setBusy(true);let tx={...form,amount:Number(form.amount),type:kind};if(kind==='income'){tx={...tx,type:form.category==='Monthly Stipend'?'stipend':'income_other',source:form.category}}else if(kind==='expense'){tx.category=form.category||'Other'}const ok=editingId?await update(editingId,tx):await add(tx);setBusy(false);if(ok){setOpen(false);setEditingId(null)}}
 const isExpense=kind==='expense',isIncome=kind==='income',isBorrow=kind==='borrow',isRepay=kind==='repay',isSavings=kind==='savings_add'||kind==='savings_use',isTransfer=kind==='transfer'||kind==='withdraw',isTransit=kind==='etransit_add';
 return <div className="gate-backdrop"><form className="wallet-modal" onSubmit={submit}>
  <div className="wallet-modal-head"><div><span className="wallet-modal-kicker">{editingId?'EDIT TRANSACTION':'NEW TRANSACTION'}</span><h2>{TITLES[kind]||'Transaction'}</h2></div><button type="button" className="icon-button" aria-label="Close" onClick={()=>setOpen(false)}>×</button></div>
  <div className="wallet-form-grid">
   <label>Amount<input type="number" min="0" step="1" value={form.amount} onChange={e=>setField('amount',e.target.value)} required autoFocus/></label>
   <label>Date<input type="date" value={form.date} onChange={e=>setField('date',e.target.value)} required/></label>
   {(isExpense||isIncome)&&<>
    <label>Category<select value={categories.includes(form.category)?form.category:''} onChange={e=>setField('category',e.target.value)} required><option value="" disabled>Select category</option>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select><button type="button" className="inline-add" onClick={()=>document.getElementById('wallet-new-category')?.focus()}>+ Add category</button></label>
    <label>Payment method<select value={form.method} onChange={e=>setField('method',e.target.value)}><option value="cash">Cash</option><option value="online">Online</option>{isExpense&&form.category==='Transport'&&<option value="etransit">E-Transit Wallet</option>}</select></label>
   </>}
   {(isBorrow||isRepay)&&<><label>Person<input value={form.person} onChange={e=>setField('person',e.target.value)} placeholder="Person name" required/></label><label>Payment method<select value={form.method} onChange={e=>setField('method',e.target.value)}><option value="cash">Cash</option><option value="online">Online</option></select></label>{isBorrow&&<label>Repayment required<select value={form.repayRequired?'yes':'no'} onChange={e=>setField('repayRequired',e.target.value==='yes')}><option value="yes">Yes</option><option value="no">No</option></select></label>}</>}
   {isSavings&&<label>{kind==='savings_add'?'Save from':'Return to'}<select value={kind==='savings_add'?form.method:form.destination} onChange={e=>setField(kind==='savings_add'?'method':'destination',e.target.value)}><option value="cash">Cash</option><option value="online">Online</option></select></label>}
   {isTransit&&<label>Load from<select value={form.from} onChange={e=>setField('from',e.target.value)}><option value="cash">Cash</option><option value="online">Online</option></select></label>}
   {isTransfer&&<><label>{kind==='withdraw'?'Withdraw from':'Transfer from'}<select value={form.from} onChange={e=>setField('from',e.target.value)}><option value="online">Online</option><option value="cash">Cash</option></select></label>{kind==='transfer'&&<label>Transfer to<select value={form.from==='cash'?'online':'cash'} readOnly><option value={form.from==='cash'?'online':'cash'}>{form.from==='cash'?'Online':'Cash'}</option></select></label>}</>}
   {(isExpense||isIncome)&&<label className="full">New {isIncome?'income':'expense'} category (optional)<div className="category-create"><input id="wallet-new-category" value={newCategory} onChange={e=>setNewCategory(e.target.value)} placeholder={isIncome?'e.g. Freelance Income':'e.g. Medical'}/><button type="button" className="wallet-btn secondary" onClick={saveCategory}>Save category</button></div></label>}
   <label className="full">Notes<textarea value={form.notes} onChange={e=>setField('notes',e.target.value)} placeholder="Add a note if needed"/></label>
  </div>
  <div className="wallet-modal-foot"><button type="button" className="wallet-btn secondary" onClick={()=>setOpen(false)}>Cancel</button><button className="wallet-btn primary" disabled={busy}>{busy?(editingId?'Updating…':'Saving…'):(editingId?'Update transaction':'Save transaction')}</button></div>
 </form></div>
}

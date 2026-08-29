'use client';

import {useEffect,useMemo,useRef,useState} from 'react';
import {useWallet} from './WalletProvider';
import {supabase} from '@/lib/supabaseClient';
import {DEFAULT_EXPENSE_CATEGORIES,DEFAULT_INCOME_CATEGORIES,todayISO,firstDayOfMonth,debtSnapshot,lendingSnapshot,money} from '@/lib/wallet/calc';

const BASE={
  type:'expense',amount:'',date:todayISO(),category:'Food',method:'cash',
  source:'',person:'',merchant:'',notes:'',repayRequired:true,from:'cash',destination:'cash',attachment_path:'',goal_id:''
};
const TITLES={
  income:'Income',expense:'Expense',transfer:'Cash ↔ Online Transfer',
  withdraw:'Withdraw Online → Cash',etransit_add:'Add to E-Transit',
  savings_add:'Add Savings',savings_use:'Use Savings',borrow:'Borrow Money',repay:'Repay Money',lend:'Lend Money',lend_repay:'Receive Repayment'
};
function normalizeType(t){return t==='income_other'||t==='salary'?'income':t;}
function displayMethod(m){return m==='etransit'?'E-Transit Wallet':m==='online'?'Online':'Cash';}

export default function WalletModal(){
  const {user,guest,add,update,addCategory,state,notify,month,currency}=useWallet();
  const [open,setOpen]=useState(false);
  const [closing,setClosing]=useState(false);
  const closeTimer=useRef(null);
  const [kind,setKind]=useState('expense');
  const [editingId,setEditingId]=useState(null);
  const [form,setForm]=useState({...BASE});
  const [busy,setBusy]=useState(false);
  const [newCategory,setNewCategory]=useState('');
  const [attachmentFile,setAttachmentFile]=useState(null);
  const [attachmentPreview,setAttachmentPreview]=useState('');
  const [attachmentRemove,setAttachmentRemove]=useState(false);
  const [attachmentError,setAttachmentError]=useState('');
  const [goals,setGoals]=useState([]);
  const [isMobile,setIsMobile]=useState(false);
  const [mobileStep,setMobileStep]=useState(1);
  const attachmentInputRef=useRef(null);

  useEffect(()=>()=>window.clearTimeout(closeTimer.current),[]);

  useEffect(()=>{
    const media=window.matchMedia('(max-width: 620px)');
    const sync=()=>setIsMobile(media.matches); sync();
    media.addEventListener?.('change',sync);
    return()=>media.removeEventListener?.('change',sync);
  },[]);

  useEffect(()=>{
    if(!attachmentFile){setAttachmentPreview('');return;}
    const url=URL.createObjectURL(attachmentFile);setAttachmentPreview(url);return()=>URL.revokeObjectURL(url);
  },[attachmentFile]);

  useEffect(()=>{
    if(!user){setGoals([]);return;}
    let active=true;
    supabase.from('wallet_goals').select('id,name,target_amount,target_date').eq('user_id',user.id).order('created_at',{ascending:true}).then(({data})=>{if(active)setGoals(data||[])});
    return()=>{active=false};
  },[user,open]);

  useEffect(()=>{
    function handleAdd(e){
      if(!user&&!guest)return;
      const detail=e.detail||'expense';const nextKind=typeof detail==='string'?detail:detail.type||'expense';const preset=typeof detail==='object'?detail:{};
      setEditingId(null);setClosing(false);setKind(nextKind);setNewCategory('');setAttachmentFile(null);setAttachmentRemove(false);setAttachmentError('');
      if(attachmentInputRef.current)attachmentInputRef.current.value='';
      const existingGoalId=preset.goal_id||preset.details?.goal_id||'';
      setForm({...BASE,...preset,type:nextKind,date:month===todayISO().slice(0,7)?todayISO():firstDayOfMonth(month),category:nextKind==='income'?'Monthly Salary':nextKind==='expense'?(preset.category||'Food'):'Food',from:nextKind==='withdraw'?'online':(preset.from||'cash'),method:nextKind==='expense'&&preset.category==='Transport'?(preset.method||'etransit'):(preset.method||'cash'),goal_id:existingGoalId});
      setMobileStep(1); setOpen(true);
    }
    function handleEdit(e){
      if(!user&&!guest)return;const t=e.detail;const k=normalizeType(t.type);setEditingId(t.id);setKind(k);setNewCategory('');setAttachmentFile(null);setAttachmentRemove(false);setAttachmentError('');
      if(attachmentInputRef.current)attachmentInputRef.current.value='';
      setClosing(false);setForm({...BASE,...t,type:k,amount:String(t.amount??''),date:t.date||todayISO(),category:t.category||(k==='income'?'Monthly Salary':'Food'),method:t.method||'cash',from:t.from||'cash',destination:t.destination||'cash',repayRequired:t.repayRequired!==false,attachment_path:t.attachment_path||'',goal_id:t.goal_id||t.details?.goal_id||''});setMobileStep(2);setOpen(true);
    }
    window.addEventListener('wallet:add',handleAdd);window.addEventListener('wallet:edit',handleEdit);return()=>{window.removeEventListener('wallet:add',handleAdd);window.removeEventListener('wallet:edit',handleEdit)};
  },[user,guest,month]);

  const custom=state?.customCategories||[];
  const categories=useMemo(()=>{const defaults=kind==='income'?DEFAULT_INCOME_CATEGORIES:DEFAULT_EXPENSE_CATEGORIES;const customForKind=custom.filter(c=>c.type===kind).map(c=>c.name);return [...new Set([...defaults,...customForKind])]},[custom,kind]);
  const outstandingPeople=useMemo(()=>{const tx=(state?.transactions||[]).filter(t=>t.id!==editingId);return debtSnapshot(tx)},[state,editingId]);
  const lendingPeople=useMemo(()=>{const tx=(state?.transactions||[]).filter(t=>t.id!==editingId);return lendingSnapshot(tx)},[state,editingId]);
  if(!open)return null;
  const setField=(f,v)=>setForm(c=>({...c,[f]:v}));
  const close=()=>{
    if(busy)return;
    setClosing(true);
    window.clearTimeout(closeTimer.current);
    closeTimer.current=window.setTimeout(()=>{
      setOpen(false);
      setClosing(false);
      setEditingId(null);
    },200);
  };

  function handleAttachmentChange(e){
    if(!user){setAttachmentError('Receipt uploads require an account.');e.target.value='';return}
    const file=e.target.files?.[0];setAttachmentError('');if(!file)return;
    if(!file.type?.startsWith('image/')){setAttachmentError('Please select an image file.');e.target.value='';return}
    if(file.size>5*1024*1024){setAttachmentError('Attachment must be 5MB or smaller.');e.target.value='';return}
    setAttachmentFile(file);setAttachmentRemove(false);
  }
  function removeAttachment(){setAttachmentFile(null);setAttachmentRemove(Boolean(form.attachment_path));setAttachmentError('');if(attachmentInputRef.current)attachmentInputRef.current.value='';}
  async function uploadAttachment(transactionId,file){
    const originalExt=String(file.name||'').split('.').pop()?.toLowerCase();const ext=originalExt&&/^[a-z0-9]{1,8}$/.test(originalExt)?originalExt:(file.type.split('/')[1]||'jpg').replace(/[^a-z0-9]/gi,'').slice(0,8)||'jpg';
    const path=`${user.id}/${transactionId}-${Date.now()}.${ext}`;const {error}=await supabase.storage.from('wallet-attachments').upload(path,file,{contentType:file.type,upsert:false});if(error){notify(error.message||'Could not upload the attachment.');return null}return path;
  }
  async function deleteAttachment(path){if(!path)return null;const {error}=await supabase.storage.from('wallet-attachments').remove([path]);return error||null}
  async function saveCategory(){const name=newCategory.trim();if(!name){notify('Enter a category name first.');return}const saved=await addCategory(name,kind==='income'?'income':'expense');if(saved){setField('category',name);setNewCategory('')}}

  async function submit(e){
    e.preventDefault();setAttachmentError('');if(!form.amount||Number(form.amount)<=0){notify('Enter a valid amount.');return}
    if((kind==='borrow'||kind==='repay'||kind==='lend'||kind==='lend_repay')&&!String(form.person||'').trim()){notify('Enter the person name.');return}
    if(kind==='repay'){const person=String(form.person||'').trim();const remaining=outstandingPeople[person]?.remaining||0;if(!remaining){notify(`No outstanding debt found for ${person}.`);return}if(Number(form.amount)>remaining){notify(`Maximum repayment for ${person} is ${money(remaining,currency)}.`);return}}
    if(kind==='lend_repay'){const person=String(form.person||'').trim();const remaining=lendingPeople[person]?.remaining||0;if(!remaining){notify(`No outstanding lending found for ${person}.`);return}if(Number(form.amount)>remaining){notify(`Maximum recovery for ${person} is ${money(remaining,currency)}.`);return}}
    if(isSavings&&form.goal_id===''){notify('Select a savings goal or General Savings.');return}
    setBusy(true);let tx={...form,amount:Number(form.amount),type:kind};
    if(kind==='income')tx={...tx,type:form.category==='Monthly Salary'?'salary':'income_other',source:form.category};
    if(kind==='expense')tx={...tx,category:form.category||'Other'};
    if(kind==='transfer')tx={...tx,destination:form.from==='cash'?'online':'cash'};
    if(isSavings){
      const selectedGoal=goals.find(g=>String(g.id)===String(form.goal_id));
      tx={...tx,category:selectedGoal?.name||'General Savings',source:selectedGoal?.name||'General Savings',details:{...(tx.details||{}),goal_id:selectedGoal?.id||null,goal_name:selectedGoal?.name||'General Savings'}};
      if(kind==='savings_use')tx.destination=form.method;
    }
    const oldPath=editingId?String(form.attachment_path||''):'';const transactionId=editingId||globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;let newPath=null;
    if(attachmentFile){newPath=await uploadAttachment(transactionId,attachmentFile);if(!newPath){setBusy(false);return}tx.attachment_path=newPath}else if(attachmentRemove)tx.attachment_path=null;else tx.attachment_path=oldPath||null;
    if(!editingId&&newPath)tx.id=transactionId;
    const ok=editingId?await update(editingId,tx):await add(tx);if(!ok){if(newPath)await deleteAttachment(newPath);setBusy(false);return}
    if(editingId&&oldPath&&(newPath||attachmentRemove)){const oldError=await deleteAttachment(oldPath);if(oldError)notify('Transaction updated, but the old attachment could not be removed.')}
    setBusy(false);if(ok){close();setAttachmentFile(null);setAttachmentRemove(false);setAttachmentError('')}
  }

  const isExpense=kind==='expense';const isIncome=kind==='income';const isBorrow=kind==='borrow';const isRepay=kind==='repay';const isLend=kind==='lend';const isLendRepay=kind==='lend_repay';const isSavings=kind==='savings_add'||kind==='savings_use';const isTransfer=kind==='transfer'||kind==='withdraw';const isTransit=kind==='etransit_add';
  const mobileTypes=[['expense','Expense','−'],['income','Income','+'],['transfer','Transfer','⇄'],['withdraw','Withdraw','↓'],['savings_add','Add Savings','◒'],['savings_use','Use Savings','↑'],['etransit_add','E-Transit','◉'],['transport','Transport','🚌'],['borrow','Borrow','↙'],['repay','Repay','↗'],['lend','Lend','↗'],['lend_repay','Repayment','↙']];
  const mobileNext=()=>{ if(mobileStep===1){setMobileStep(2);return;} if(mobileStep===2){if(!form.amount||Number(form.amount)<=0){notify('Enter a valid amount.');return}setMobileStep(3);return;} if(mobileStep===3){setMobileStep(4);} };
  const mobileBack=()=>setMobileStep(Math.max(1,mobileStep-1));
  const renderMobileDetails=()=> <div className="wallet-mobile-flow-details">
    {(isExpense||isIncome)&&<><label>Category<select value={categories.includes(form.category)?form.category:''} onChange={e=>setField('category',e.target.value)} required><option value="" disabled>Select category</option>{categories.map(c=><option key={c} value={c}>{categoryIcon(c)} {c}</option>)}</select></label><label>Payment method<select value={form.method} onChange={e=>setField('method',e.target.value)}><option value="cash">Cash</option><option value="online">Online</option>{isExpense&&form.category==='Transport'&&<option value="etransit">E-Transit Wallet</option>}</select></label></>}
    {isExpense&&<label>Merchant (optional)<input value={form.merchant||''} onChange={e=>setField('merchant',e.target.value)} placeholder="e.g. McDonald's"/></label>}
    {(isBorrow||isRepay||isLend||isLendRepay)&&<><label>Person<input value={form.person} onChange={e=>setField('person',e.target.value)} placeholder="Person name" required/></label><label>{isBorrow?'Receive into':isLend?'Lend from':isLendRepay?'Receive into':'Repay from'}<select value={form.method} onChange={e=>setField('method',e.target.value)}><option value="cash">Cash</option><option value="online">Online</option></select></label>{isBorrow&&<label>Repayment required<select value={form.repayRequired?'yes':'no'} onChange={e=>setField('repayRequired',e.target.value==='yes')}><option value="yes">Yes</option><option value="no">No</option></select></label>}</>}
    {isSavings&&<><label>Savings category<select value={form.goal_id} onChange={e=>setField('goal_id',e.target.value)} required><option value="">Select savings goal</option><option value="general">General Savings</option>{goals.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label><label>{kind==='savings_add'?'Save from':'Use from'}<select value={form.method} onChange={e=>setField('method',e.target.value)}><option value="cash">Cash</option><option value="online">Online</option></select></label></>}
    {isTransit&&<label>Load from<select value={form.from} onChange={e=>setField('from',e.target.value)}><option value="cash">Cash</option><option value="online">Online</option></select></label>}
    {isTransfer&&<label>{kind==='withdraw'?'Withdraw from':'Transfer from'}<select value={form.from} onChange={e=>setField('from',e.target.value)}>{kind==='withdraw'?<option value="online">Online</option>:<><option value="online">Online</option><option value="cash">Cash</option></>}</select></label>}
    <label>Date<input type="date" value={form.date} onChange={e=>setField('date',e.target.value)} required/></label>
    <label>Notes (optional)<textarea value={form.notes} onChange={e=>setField('notes',e.target.value)} placeholder="Add a note if needed"/></label>
  </div>;
  return <div className={`gate-backdrop ${closing ? "is-closing" : ""}`}><form className={`wallet-modal ${closing ? "is-closing" : ""} ${isMobile ? "is-mobile-viewport" : ""}`} onSubmit={submit}>
    <div className="wallet-modal-head"><div><span className="wallet-modal-kicker">{editingId?'EDIT TRANSACTION':'NEW TRANSACTION'}</span><h2>{TITLES[kind]||'Transaction'}</h2></div><button type="button" className="icon-button" aria-label="Close" onClick={close}>×</button></div>
    <div className="wallet-modal-desktop-form"><div className="wallet-form-grid">
      <label>Amount<input type="number" min="1" step="1" inputMode="decimal" value={form.amount} onChange={e=>setField('amount',e.target.value)} required autoFocus/></label>
      <label>Date<input type="date" value={form.date} onChange={e=>setField('date',e.target.value)} required/></label>
      {(isExpense||isIncome)&&<><label>Category<select value={categories.includes(form.category)?form.category:''} onChange={e=>setField('category',e.target.value)} required><option value="" disabled>Select category</option>{categories.map(c=><option key={c} value={c}>{categoryIcon(c)} {c}</option>)}</select><button type="button" className="inline-add" onClick={()=>document.getElementById('wallet-new-category')?.focus()}>+ Add category</button></label><label>Payment method<select value={form.method} onChange={e=>setField('method',e.target.value)}><option value="cash">Cash</option><option value="online">Online</option>{isExpense&&form.category==='Transport'&&<option value="etransit">E-Transit Wallet</option>}</select></label><label className="full category-helper">New {isIncome?'income':'expense'} category<div className="category-create"><input id="wallet-new-category" value={newCategory} onChange={e=>setNewCategory(e.target.value)} placeholder={isIncome?'e.g. Freelance Income':'e.g. Medical'}/><button type="button" className="wallet-btn secondary" onClick={saveCategory}>Save category</button></div><small>This category will only appear in {isIncome?'Income':'Expense'} transactions.</small></label></>}
      {isExpense&&<label className="full">Merchant (optional)<input value={form.merchant||''} onChange={e=>setField('merchant',e.target.value)} placeholder="e.g. McDonald's"/></label>}
      {(isBorrow||isRepay||isLend||isLendRepay)&&<><label>Person<input value={form.person} onChange={e=>setField('person',e.target.value)} placeholder="Person name" required/></label><label>{isBorrow?'Receive into':isLend?'Lend from':isLendRepay?'Receive into':'Repay from'}<select value={form.method} onChange={e=>setField('method',e.target.value)}><option value="cash">Cash</option><option value="online">Online</option></select></label>{isBorrow&&<label>Repayment required<select value={form.repayRequired?'yes':'no'} onChange={e=>setField('repayRequired',e.target.value==='yes')}><option value="yes">Yes</option><option value="no">No</option></select></label>}</>}
      {isSavings&&<><label>Savings category<select value={form.goal_id} onChange={e=>setField('goal_id',e.target.value)} required><option value="">Select savings goal</option><option value="general">General Savings</option>{goals.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label><label>{kind==='savings_add'?'Save from':'Use from'}<select value={form.method} onChange={e=>setField('method',e.target.value)}><option value="cash">Cash</option><option value="online">Online</option></select></label></>}
      {isTransit&&<label>Load from<select value={form.from} onChange={e=>setField('from',e.target.value)}><option value="cash">Cash</option><option value="online">Online</option></select></label>}
      {isTransfer&&<><label>{kind==='withdraw'?'Withdraw from':'Transfer from'}<select value={form.from} onChange={e=>setField('from',e.target.value)}>{kind==='withdraw'?<option value="online">Online</option>:<><option value="online">Online</option><option value="cash">Cash</option></>}</select></label>{kind==='transfer'&&<label>Transfer to<input value={form.from==='cash'?'Online':'Cash'} readOnly/></label>}</>}
      <label className="full wallet-attachment-field">Attach receipt (optional)<input ref={attachmentInputRef} id="wallet-attachment" type="file" accept="image/*" onChange={handleAttachmentChange} disabled={!user}/>{!user&&<small>Receipt uploads are available after you create an account.</small>}{attachmentPreview&&<div className="wallet-attachment-preview"><img src={attachmentPreview} alt="Receipt preview"/><button type="button" className="table-action delete" onClick={removeAttachment}>Remove</button></div>}{!attachmentPreview&&form.attachment_path&&!attachmentRemove&&<div className="wallet-current-attachment"><span>📎 Receipt attached</span><button type="button" className="table-action delete" onClick={removeAttachment}>Remove</button></div>}{!attachmentPreview&&attachmentRemove&&<small className="wallet-attachment-removed">The current attachment will be removed when you save.</small>}{attachmentError&&<small className="wallet-attachment-error">{attachmentError}</small>}</label>
      <label className="full">Notes<textarea value={form.notes} onChange={e=>setField('notes',e.target.value)} placeholder="Add a note if needed"/></label>
    </div></div>
    <div className="wallet-modal-mobile-flow">
      <div className="wallet-mobile-stepper"><span className={mobileStep>=1?'active':''}>1</span><i/><span className={mobileStep>=2?'active':''}>2</span><i/><span className={mobileStep>=3?'active':''}>3</span><i/><span className={mobileStep>=4?'active':''}>4</span></div>
      {mobileStep===1&&<div className="wallet-mobile-flow-step"><p>What are you adding?</p><div className="wallet-mobile-type-grid">{mobileTypes.map(([type,label,icon])=><button type="button" key={type} className={kind===type?'selected':''} onClick={()=>{setKind(type);setForm(f=>({...f,type,category:type==='income'?'Monthly Salary':type==='expense'?(f.category||'Food'):'Food'}));}}><b>{icon}</b><span>{label}</span></button>)}</div></div>}
      {mobileStep===2&&<div className="wallet-mobile-flow-step wallet-mobile-amount-step"><p>How much?</p><div className="wallet-mobile-amount-display"><span>Rs.</span><input type="number" min="1" step="1" inputMode="decimal" value={form.amount} onChange={e=>setField('amount',e.target.value)} placeholder="0" autoFocus/></div></div>}
      {mobileStep===3&&<div className="wallet-mobile-flow-step"><p>Details</p>{renderMobileDetails()}</div>}
      {mobileStep===4&&<div className="wallet-mobile-flow-step"><p>Confirm transaction</p><div className="wallet-mobile-confirm-card"><span>{categoryIcon(form.category)} {form.category||TITLES[kind]}</span><strong>{money(Number(form.amount)||0,currency)}</strong><small>{TITLES[kind]||'Transaction'} · {form.date}</small>{form.person&&<small>Person: {form.person}</small>}{form.method&&<small>Method: {displayMethod(form.method)}</small>}</div></div>}
    </div>
    <div className="wallet-modal-foot">
      <button type="button" className="wallet-btn secondary wallet-mobile-back" onClick={mobileStep===1?close:mobileBack} disabled={busy}>{mobileStep===1?'Cancel':'Back'}</button>
      <button type="button" className="wallet-btn primary wallet-mobile-next" onClick={mobileStep===4?()=>submit({preventDefault:()=>{}}):mobileNext} disabled={busy}>{mobileStep===4?(busy?(editingId?'Updating…':'Saving…'):(editingId?'Update transaction':'Save transaction')):'Continue'}</button>
      <button type="button" className="wallet-btn secondary wallet-desktop-cancel" onClick={close} disabled={busy}>Cancel</button><button className="wallet-btn primary wallet-desktop-save" disabled={busy}>{busy?(editingId?'Updating…':'Saving…'):(editingId?'Update transaction':'Save transaction')}</button>
    </div>
  </form></div>;
}

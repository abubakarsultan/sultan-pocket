'use client';

import {useEffect,useMemo,useRef,useState} from 'react';
import {useWallet} from './WalletProvider';
import {supabase} from '@/lib/supabaseClient';
import {DEFAULT_EXPENSE_CATEGORIES,DEFAULT_INCOME_CATEGORIES,todayISO,firstDayOfMonth,debtSnapshot,money} from '@/lib/wallet/calc';

const BASE={
  type:'expense',amount:'',date:todayISO(),category:'Food',method:'cash',
  source:'',person:'',merchant:'',notes:'',repayRequired:true,from:'cash',destination:'cash',attachment_path:''
};
const TITLES={
  income:'Income',expense:'Expense',transfer:'Cash ↔ Online Transfer',
  withdraw:'Withdraw Online → Cash',etransit_add:'Add to E-Transit',
  savings_add:'Add Savings',savings_use:'Use Savings',borrow:'Borrow Money',repay:'Repay Money'
};
function normalizeType(t){return t==='income_other'||t==='salary'?'income':t;}

export default function WalletModal(){
  const {user,add,update,addCategory,state,notify,month,currency}=useWallet();
  const [open,setOpen]=useState(false);
  const [kind,setKind]=useState('expense');
  const [editingId,setEditingId]=useState(null);
  const [form,setForm]=useState({...BASE});
  const [busy,setBusy]=useState(false);
  const [newCategory,setNewCategory]=useState('');
  const [attachmentFile,setAttachmentFile]=useState(null);
  const [attachmentPreview,setAttachmentPreview]=useState('');
  const [attachmentRemove,setAttachmentRemove]=useState(false);
  const [attachmentError,setAttachmentError]=useState('');
  const attachmentInputRef=useRef(null);

  useEffect(()=>{
    if(!attachmentFile){
      setAttachmentPreview('');
      return;
    }
    const url=URL.createObjectURL(attachmentFile);
    setAttachmentPreview(url);
    return()=>URL.revokeObjectURL(url);
  },[attachmentFile]);

  useEffect(()=>{
    function handleAdd(e){
      if(!user)return;
      const detail=e.detail||'expense';
      const nextKind=typeof detail==='string'?detail:detail.type||'expense';
      const preset=typeof detail==='object'?detail:{};
      setEditingId(null);
      setKind(nextKind);
      setNewCategory('');
      setAttachmentFile(null);
      setAttachmentRemove(false);
      setAttachmentError('');
      if(attachmentInputRef.current) attachmentInputRef.current.value='';
      setForm({
        ...BASE,
        ...preset,
        type:nextKind,
        date:month===todayISO().slice(0,7)?todayISO():firstDayOfMonth(month),
        category:nextKind==='income'?'Monthly Salary':nextKind==='expense'?(preset.category||'Food'):'Food',
        from:nextKind==='withdraw'?'online':(preset.from||'cash'),
        method:nextKind==='expense'&&preset.category==='Transport'?(preset.method||'etransit'):(preset.method||'cash'),
      });
      setOpen(true);
    }
    function handleEdit(e){
      if(!user||!e.detail)return;
      const t=e.detail;
      const k=normalizeType(t.type);
      setEditingId(t.id);
      setKind(k);
      setNewCategory('');
      setAttachmentFile(null);
      setAttachmentRemove(false);
      setAttachmentError('');
      if(attachmentInputRef.current) attachmentInputRef.current.value='';
      setForm({
        ...BASE,...t,type:k,
        amount:String(t.amount??''),
        date:t.date||todayISO(),
        category:t.category||(k==='income'?'Monthly Salary':'Food'),
        method:t.method||'cash',
        from:t.from||'cash',
        destination:t.destination||'cash',
        repayRequired:t.repayRequired!==false,
        attachment_path:t.attachment_path||'',
      });
      setOpen(true);
    }
    window.addEventListener('wallet:add',handleAdd);
    window.addEventListener('wallet:edit',handleEdit);
    return()=>{
      window.removeEventListener('wallet:add',handleAdd);
      window.removeEventListener('wallet:edit',handleEdit);
    };
  },[user]);

  const custom=state?.customCategories||[];
  const categories=useMemo(()=>{
    const defaults=kind==='income'?DEFAULT_INCOME_CATEGORIES:DEFAULT_EXPENSE_CATEGORIES;
    const customForKind=custom.filter(c=>c.type===kind).map(c=>c.name);
    return [...new Set([...defaults,...customForKind])];
  },[custom,kind]);

  const outstandingPeople=useMemo(()=>{
    const tx=(state?.transactions||[]).filter(t=>t.id!==editingId);
    return debtSnapshot(tx);
  },[state,editingId]);

  if(!open)return null;

  const setField=(f,v)=>setForm(c=>({...c,[f]:v}));
  const close=()=>{if(!busy){setOpen(false);setEditingId(null);}};

  function handleAttachmentChange(e){
    const file=e.target.files?.[0];
    setAttachmentError('');
    if(!file)return;
    if(!file.type?.startsWith('image/')){
      setAttachmentError('Please select an image file.');
      e.target.value='';
      return;
    }
    if(file.size>5*1024*1024){
      setAttachmentError('Attachment must be 5MB or smaller.');
      e.target.value='';
      return;
    }
    setAttachmentFile(file);
    setAttachmentRemove(false);
  }

  function removeAttachment(){
    setAttachmentFile(null);
    setAttachmentRemove(Boolean(form.attachment_path));
    setAttachmentError('');
    if(attachmentInputRef.current) attachmentInputRef.current.value='';
  }

  async function uploadAttachment(transactionId,file){
    const originalExt=String(file.name||'').split('.').pop()?.toLowerCase();
    const ext=originalExt&&/^[a-z0-9]{1,8}$/.test(originalExt)
      ? originalExt
      : (file.type.split('/')[1]||'jpg').replace(/[^a-z0-9]/gi,'').slice(0,8)||'jpg';
    const path=`${user.id}/${transactionId}-${Date.now()}.${ext}`;
    const {error}=await supabase.storage.from('wallet-attachments').upload(path,file,{contentType:file.type,upsert:false});
    if(error){
      notify(error.message||'Could not upload the attachment.');
      return null;
    }
    return path;
  }

  async function deleteAttachment(path){
    if(!path)return null;
    const {error}=await supabase.storage.from('wallet-attachments').remove([path]);
    return error||null;
  }

  async function saveCategory(){
    const name=newCategory.trim();
    if(!name){notify('Enter a category name first.');return;}
    const saved=await addCategory(name,kind==='income'?'income':'expense');
    if(saved){setField('category',name);setNewCategory('');}
  }

  async function submit(e){
    e.preventDefault();
    setAttachmentError('');
    if(!form.amount||Number(form.amount)<=0){notify('Enter a valid amount.');return;}
    if((kind==='borrow'||kind==='repay')&&!String(form.person||'').trim()){
      notify('Enter the person name.');return;
    }
    if(kind==='repay'){
      const person=String(form.person||'').trim();
      const remaining=outstandingPeople[person]?.remaining||0;
      if(!remaining){notify(`No outstanding debt found for ${person}.`);return;}
      if(Number(form.amount)>remaining){notify(`Maximum repayment for ${person} is ${money(remaining,currency)}.`);return;}
    }

    setBusy(true);
    let tx={...form,amount:Number(form.amount),type:kind};
    if(kind==='income'){
      tx={...tx,type:form.category==='Monthly Salary'?'salary':'income_other',source:form.category};
    }
    if(kind==='expense'){
      tx={...tx,category:form.category||'Other'};
    }
    if(kind==='transfer'){
      tx={...tx,destination:form.from==='cash'?'online':'cash'};
    }

    const oldPath=editingId?String(form.attachment_path||''):'';
    const transactionId=editingId||globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;
    let newPath=null;

    if(attachmentFile){
      newPath=await uploadAttachment(transactionId,attachmentFile);
      if(!newPath){setBusy(false);return;}
      tx.attachment_path=newPath;
    }else if(attachmentRemove){
      tx.attachment_path=null;
    }else{
      tx.attachment_path=oldPath||null;
    }

    if(!editingId&&newPath)tx.id=transactionId;

    const ok=editingId?await update(editingId,tx):await add(tx);
    if(!ok){
      if(newPath)await deleteAttachment(newPath);
      setBusy(false);
      return;
    }

    if(editingId&&oldPath&&(newPath||attachmentRemove)){
      const oldError=await deleteAttachment(oldPath);
      if(oldError)notify('Transaction updated, but the old attachment could not be removed.');
    }

    setBusy(false);
    if(ok){
      setOpen(false);
      setEditingId(null);
      setAttachmentFile(null);
      setAttachmentRemove(false);
      setAttachmentError('');
    }
  }

  const isExpense=kind==='expense';
  const isIncome=kind==='income';
  const isBorrow=kind==='borrow';
  const isRepay=kind==='repay';
  const isSavings=kind==='savings_add'||kind==='savings_use';
  const isTransfer=kind==='transfer'||kind==='withdraw';
  const isTransit=kind==='etransit_add';

  return <div className="gate-backdrop">
    <form className="wallet-modal" onSubmit={submit}>
      <div className="wallet-modal-head">
        <div>
          <span className="wallet-modal-kicker">{editingId?'EDIT TRANSACTION':'NEW TRANSACTION'}</span>
          <h2>{TITLES[kind]||'Transaction'}</h2>
        </div>
        <button type="button" className="icon-button" aria-label="Close" onClick={close}>×</button>
      </div>

      <div className="wallet-form-grid">
        <label>Amount
          <input type="number" min="1" step="1" inputMode="decimal" value={form.amount} onChange={e=>setField('amount',e.target.value)} required autoFocus/>
        </label>
        <label>Date
          <input type="date" value={form.date} onChange={e=>setField('date',e.target.value)} required/>
        </label>

        {(isExpense||isIncome)&&<>
          <label>Category
            <select value={categories.includes(form.category)?form.category:''} onChange={e=>setField('category',e.target.value)} required>
              <option value="" disabled>Select category</option>
              {categories.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <button type="button" className="inline-add" onClick={()=>document.getElementById('wallet-new-category')?.focus()}>+ Add category</button>
          </label>
          <label>Payment method
            <select value={form.method} onChange={e=>setField('method',e.target.value)}>
              <option value="cash">Cash</option>
              <option value="online">Online</option>
              {isExpense&&form.category==='Transport'&&<option value="etransit">E-Transit Wallet</option>}
            </select>
          </label>
          <label className="full category-helper">
            New {isIncome?'income':'expense'} category
            <div className="category-create">
              <input id="wallet-new-category" value={newCategory} onChange={e=>setNewCategory(e.target.value)} placeholder={isIncome?'e.g. Freelance Income':'e.g. Medical'}/>
              <button type="button" className="wallet-btn secondary" onClick={saveCategory}>Save category</button>
            </div>
            <small>This category will only appear in {isIncome?'Income':'Expense'} transactions.</small>
          </label>
        </>}

        {isExpense&&<label className="full">Merchant (optional)
          <input value={form.merchant||''} onChange={e=>setField('merchant',e.target.value)} placeholder="e.g. McDonald's"/>
        </label>}

        {(isBorrow||isRepay)&&<>
          <label>Person
            <input value={form.person} onChange={e=>setField('person',e.target.value)} placeholder="Person name" required/>
          </label>
          <label>{isBorrow?'Receive into':'Repay from'}
            <select value={form.method} onChange={e=>setField('method',e.target.value)}>
              <option value="cash">Cash</option>
              <option value="online">Online</option>
            </select>
          </label>
          {isBorrow&&<label>Repayment required
            <select value={form.repayRequired?'yes':'no'} onChange={e=>setField('repayRequired',e.target.value==='yes')}>
              <option value="yes">Yes</option><option value="no">No</option>
            </select>
          </label>}
        </>}

        {isSavings&&<label>{kind==='savings_add'?'Save from':'Return to'}
          <select value={kind==='savings_add'?form.method:form.destination} onChange={e=>setField(kind==='savings_add'?'method':'destination',e.target.value)}>
            <option value="cash">Cash</option><option value="online">Online</option>
          </select>
        </label>}

        {isTransit&&<label>Load from
          <select value={form.from} onChange={e=>setField('from',e.target.value)}>
            <option value="cash">Cash</option><option value="online">Online</option>
          </select>
        </label>}

        {isTransfer&&<>
          <label>{kind==='withdraw'?'Withdraw from':'Transfer from'}
            <select value={form.from} onChange={e=>setField('from',e.target.value)}>
              {kind==='withdraw'?<option value="online">Online</option>:<><option value="online">Online</option><option value="cash">Cash</option></>}
            </select>
          </label>
          {kind==='transfer'&&<label>Transfer to
            <input value={form.from==='cash'?'Online':'Cash'} readOnly/>
          </label>}
        </>}

        <label className="full wallet-attachment-field">Attach receipt (optional)
          <input
            ref={attachmentInputRef}
            id="wallet-attachment"
            type="file"
            accept="image/*"
            onChange={handleAttachmentChange}
          />

          {attachmentPreview && (
            <div className="wallet-attachment-preview">
              <img src={attachmentPreview} alt="Receipt preview" />
              <button type="button" className="table-action delete" onClick={removeAttachment}>Remove</button>
            </div>
          )}

          {!attachmentPreview && form.attachment_path && !attachmentRemove && (
            <div className="wallet-current-attachment">
              <span>📎 Receipt attached</span>
              <button type="button" className="table-action delete" onClick={removeAttachment}>Remove</button>
            </div>
          )}

          {!attachmentPreview && attachmentRemove && (
            <small className="wallet-attachment-removed">The current attachment will be removed when you save.</small>
          )}

          {attachmentError && (
            <small className="wallet-attachment-error">{attachmentError}</small>
          )}
        </label>

        <label className="full">Notes
          <textarea value={form.notes} onChange={e=>setField('notes',e.target.value)} placeholder="Add a note if needed"/>
        </label>
      </div>

      <div className="wallet-modal-foot">
        <button type="button" className="wallet-btn secondary" onClick={close} disabled={busy}>Cancel</button>
        <button className="wallet-btn primary" disabled={busy}>
          {busy?(editingId?'Updating…':'Saving…'):(editingId?'Update transaction':'Save transaction')}
        </button>
      </div>
    </form>
  </div>;
}

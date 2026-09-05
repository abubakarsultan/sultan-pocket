'use client';

import { useEffect, useRef, useState } from 'react';
import { useWallet } from './WalletProvider';
import { supabase } from '@/lib/supabaseClient';
import { DEFAULT_EXPENSE_CATEGORIES, todayISO, money } from '@/lib/wallet/calc';

const CATEGORY_ICONS = { Food:'🍔', Transport:'🚌', Bills:'💡', Shopping:'🛍️', Groceries:'🛒', Entertainment:'🎬', Health:'❤️', Education:'📚', Rent:'🏠', Utilities:'💡', Personal:'🙂', Other:'📌' };
function categoryIcon(name){ return CATEGORY_ICONS[String(name||'')] || '📌'; }

function fileToBase64(file){
  return new Promise((resolve,reject)=>{
    const r=new FileReader();
    r.onload=()=>resolve(String(r.result).split(',')[1]||'');
    r.onerror=()=>reject(new Error('Could not read the file.'));
    r.readAsDataURL(file);
  });
}

export default function ReceiptScanModal(){
  const { user, add, state, notify, currency } = useWallet();
  const [open,setOpen]=useState(false);
  const [step,setStep]=useState('pick'); // pick | scanning | review | saving
  const [file,setFile]=useState(null);
  const [preview,setPreview]=useState('');
  const [result,setResult]=useState(null); // {amount, merchant, date, category, confidence}
  const [error,setError]=useState('');
  const inputRef=useRef(null);

  const categories = [...new Set([...DEFAULT_EXPENSE_CATEGORIES, ...(state?.customCategories||[]).filter(c=>c.type==='expense').map(c=>c.name)])];

  useEffect(()=>{
    function handleOpen(){ setOpen(true); setStep('pick'); setFile(null); setPreview(''); setResult(null); setError(''); }
    window.addEventListener('wallet:scan-receipt', handleOpen);
    return ()=>window.removeEventListener('wallet:scan-receipt', handleOpen);
  },[]);

  useEffect(()=>{
    if(!file){ setPreview(''); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return ()=>URL.revokeObjectURL(url);
  },[file]);

  function close(){ if(step==='scanning'||step==='saving') return; setOpen(false); }

  async function handleFile(e){
    const f = e.target.files?.[0];
    if(!f) return;
    if(!f.type?.startsWith('image/')){ setError('Please select an image file.'); return; }
    if(f.size > 5*1024*1024){ setError('Image must be 5MB or smaller.'); return; }
    setError('');
    setFile(f);
    setStep('scanning');
    try{
      const imageBase64 = await fileToBase64(f);
      const res = await fetch('/api/receipt-scan', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ imageBase64, mimeType: f.type }) });
      const data = await res.json();
      if(!res.ok || !data.ok || (!data.amount && !data.merchant)){
        setResult({ amount:'', merchant:'', date: todayISO(), category:'Other', confidence:'low' });
        setError('Photo se data nahi mil saka — fields manually bhar lein.');
      } else {
        setResult({
          amount: data.amount ? String(data.amount) : '',
          merchant: data.merchant || '',
          date: data.date || todayISO(),
          category: (data.category_guess && categories.includes(data.category_guess)) ? data.category_guess : 'Other',
          confidence: data.confidence || 'low',
        });
        if(data.confidence === 'low') setError('Kuch fields shayad ghalat hon — verify kar lein.');
      }
    }catch{
      setResult({ amount:'', merchant:'', date: todayISO(), category:'Other', confidence:'low' });
      setError('Photo se data nahi mil saka — fields manually bhar lein.');
    }finally{
      setStep('review');
    }
  }

  function setField(f,v){ setResult(r=>({...r,[f]:v})); }

  async function confirmSave(){
    if(!result?.amount || Number(result.amount) <= 0){ notify('Enter a valid amount.'); return; }
    setStep('saving');
    let attachment_path = null;
    if(user && file){
      const ext = (file.name||'').split('.').pop()?.toLowerCase() || (file.type.split('/')[1]||'jpg');
      const path = `${user.id}/${globalThis.crypto?.randomUUID?.()||Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('wallet-attachments').upload(path, file, { contentType: file.type, upsert:false });
      if(!upErr) attachment_path = path;
    }
    const ok = await add({
      type: 'expense',
      amount: Number(result.amount),
      date: result.date || todayISO(),
      category: result.category || 'Other',
      method: 'cash',
      merchant: result.merchant || null,
      notes: result.merchant ? `Scanned receipt: ${result.merchant}` : 'Scanned receipt',
      attachment_path,
      repayRequired: true,
      from: 'cash',
      destination: 'cash',
    });
    setStep('review');
    if(ok){ notify('Transaction added from receipt.'); setOpen(false); }
  }

  if(!open) return null;

  return (
    <div className="gate-backdrop" onMouseDown={e=>{ if(e.target===e.currentTarget) close(); }}>
      <div className="wallet-modal" role="dialog" aria-modal="true">
        <div className="wallet-modal-head">
          <div><span className="wallet-modal-kicker">SCAN RECEIPT</span><h2>Receipt se Add Karein</h2></div>
          <button type="button" className="icon-button" aria-label="Close" onClick={close}>×</button>
        </div>

        <div className="wallet-form-grid" style={{padding:'16px'}}>
          {step==='pick' && (
            <label className="full wallet-attachment-field">
              Receipt ki photo lein ya select karein
              <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} disabled={!user} />
              {!user && <small>Receipt scan sirf signed-in account ke liye available hai.</small>}
              {error && <small className="wallet-attachment-error">{error}</small>}
            </label>
          )}

          {step==='scanning' && (
            <div className="full" style={{textAlign:'center',padding:'24px 0'}}>
              {preview && <img src={preview} alt="Receipt preview" style={{maxWidth:'220px',maxHeight:'220px',borderRadius:'8px',marginBottom:'12px'}}/>}
              <p>🔍 Receipt scan ho raha hai…</p>
            </div>
          )}

          {step==='review' && result && (
            <>
              {preview && <div className="full" style={{textAlign:'center'}}><img src={preview} alt="Receipt preview" style={{maxWidth:'160px',maxHeight:'160px',borderRadius:'8px',marginBottom:'8px'}}/></div>}
              {error && <small className="full wallet-attachment-scan-notice">{error}</small>}
              <label>Amount<input type="number" min="1" step="1" inputMode="decimal" value={result.amount} onChange={e=>setField('amount',e.target.value)} autoFocus/></label>
              <label>Date<input type="date" value={result.date} onChange={e=>setField('date',e.target.value)}/></label>
              <label>Category<select value={result.category} onChange={e=>setField('category',e.target.value)}>{categories.map(c=><option key={c} value={c}>{categoryIcon(c)} {c}</option>)}</select></label>
              <label className="full">Merchant (optional)<input value={result.merchant} onChange={e=>setField('merchant',e.target.value)} placeholder="e.g. Sultan General Store"/></label>
              {result.amount && <p className="full" style={{fontWeight:600}}>Total: {money(Number(result.amount)||0,currency)}</p>}
            </>
          )}

          {step==='saving' && <div className="full" style={{textAlign:'center',padding:'24px 0'}}><p>Saving…</p></div>}
        </div>

        <div className="wallet-modal-foot">
          <button type="button" className="wallet-btn secondary" onClick={close} disabled={step==='scanning'||step==='saving'}>Cancel</button>
          {step==='review' && <button type="button" className="wallet-btn primary" onClick={confirmSave} disabled={step==='saving'}>Confirm & Save</button>}
        </div>
      </div>
    </div>
  );
}

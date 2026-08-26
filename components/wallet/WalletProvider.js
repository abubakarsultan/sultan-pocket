'use client';

import {createContext,useContext,useEffect,useMemo,useState} from 'react';
import {usePathname} from 'next/navigation';
import Confetti from '@/components/Confetti';
import {supabase} from '@/lib/supabaseClient';
import {balances,todayISO} from '@/lib/wallet/calc';

const C = createContext(null);
const EMPTY = {transactions:[],customCategories:[],recurringRules:[]};
const GUEST_STORAGE_KEY = 'sultan-pocket-guest-v1';
const GUEST_TRANSACTION_LIMIT = 3;
const GUEST_INTERACTION_LIMIT = 10;

const DEMO_TRANSACTIONS = [
  {id:'demo-1',type:'salary',amount:50000,date:'2026-08-01',category:'Monthly Salary',source:'Monthly Salary',method:'online',notes:'Demo income'},
  {id:'demo-2',type:'expense',amount:6500,date:'2026-08-02',category:'Food',method:'cash',notes:'Demo food expense'},
  {id:'demo-3',type:'expense',amount:2500,date:'2026-08-04',category:'Bills',method:'online',notes:'Demo bills'},
  {id:'demo-4',type:'transfer',amount:5000,date:'2026-08-05',from:'online',notes:'Demo transfer'},
  {id:'demo-5',type:'etransit_add',amount:1500,date:'2026-08-06',from:'online',notes:'Demo transport top-up'},
  {id:'demo-6',type:'expense',amount:420,date:'2026-08-07',category:'Transport',method:'etransit',notes:'Demo transport'},
  {id:'demo-7',type:'savings_add',amount:5000,date:'2026-08-08',method:'online',notes:'Demo savings'},
  {id:'demo-8',type:'borrow',amount:3000,date:'2026-08-09',person:'Demo Friend',method:'cash',repayRequired:true,notes:'Demo borrowing'},
];

function normalizeCategories(list){
  return (Array.isArray(list)?list:[])
    .map(item => typeof item === 'string'
      ? {name:item,type:'expense'}
      : {name:String(item?.name||'').trim(),type:item?.type==='income'?'income':'expense'})
    .filter(x => x.name);
}

function normalizeTransactions(list){
  return (Array.isArray(list)?list:[]).filter(Boolean).map((t,i)=>({
    ...t,
    id:t.id ?? `local-${i+1}`,
    amount:Number(t.amount)||0,
    date:t.date || todayISO(),
  }));
}

function rowToTransaction(row){
  const details=row.details&&typeof row.details==='object'?row.details:{};
  return normalizeTransactions([{...details,
    id:row.id,
    type:row.type,
    amount:row.amount,
    date:row.date,
    category:row.category||details.category||'',
    method:row.method||details.method||'',
    source:row.source||details.source||'',
    person:row.person||details.person||'',
    notes:row.notes||details.notes||'',
    repayRequired:row.repay_required,
    from:row.from_account||details.from||'',
    destination:row.destination||details.destination||'',
    attachment_path:row.attachment_path||details.attachment_path||'',
    merchant:row.merchant||details.merchant||'',
    created_at:row.created_at,
    updated_at:row.updated_at,
  }])[0];
}

function transactionRow(tx,userId){
  return {
    id:tx.id,
    user_id:userId,
    type:tx.type,
    amount:Number(tx.amount)||0,
    date:tx.date,
    category:tx.category||null,
    method:tx.method||null,
    source:tx.source||null,
    person:tx.person||null,
    notes:tx.notes||null,
    repay_required:tx.repayRequired!==false,
    from_account:tx.from||null,
    destination:tx.destination||null,
    attachment_path:tx.attachment_path||null,
    merchant:tx.merchant||null,
    details:tx,
  };
}

function recurringRow(rule,userId){
  return {
    id:rule.id,
    user_id:userId,
    type:rule.type,
    amount:Number(rule.amount)||0,
    day_of_month:Number(rule.day_of_month)||1,
    category:rule.category||null,
    method:rule.method||null,
    source:rule.source||null,
    person:rule.person||null,
    notes:rule.notes||null,
    details:rule.details||null,
    active:rule.active!==false,
  };
}

function rowToRecurring(row){
  return {
    id:row.id,
    user_id:row.user_id,
    type:row.type,
    amount:Number(row.amount)||0,
    day_of_month:Number(row.day_of_month)||1,
    category:row.category||'',
    method:row.method||'',
    source:row.source||'',
    person:row.person||'',
    notes:row.notes||'',
    details:row.details&&typeof row.details==='object'?row.details:{},
    active:row.active!==false,
    created_at:row.created_at,
  };
}

function getValidationMessage(tx, nextTransactions){
  const amount = Number(tx.amount)||0;
  if (amount <= 0) return 'Enter a valid amount.';
  if (!tx.date) return 'Select a date.';
  const b = balances(nextTransactions);
  const priorTransactions = nextTransactions.filter((item) => item !== tx);
  const priorBalances = balances(priorTransactions);
  const moneyTooLow = (value,label) => value < -0.0001 ? `Not enough ${label} for this transaction.` : '';
  if (tx.type === 'expense') {
    if (tx.method === 'cash') return moneyTooLow(b.cash,'cash');
    if (tx.method === 'online') return moneyTooLow(b.online,'online balance');
    return moneyTooLow(b.etransit,'E-Transit balance');
  }
  if (tx.type === 'transfer' || tx.type === 'withdraw') {
    return tx.type==='withdraw' ? moneyTooLow(b.online,'online balance') : (tx.from === 'cash' ? moneyTooLow(b.cash,'cash') : moneyTooLow(b.online,'online balance'));
  }
  if (tx.type === 'etransit_add') return tx.from === 'cash' ? moneyTooLow(b.cash,'cash') : moneyTooLow(b.online,'online balance');
  if (tx.type === 'savings_add') return tx.method === 'cash' ? moneyTooLow(b.cash,'cash') : moneyTooLow(b.online,'online balance');
  if (tx.type === 'savings_use') return moneyTooLow(b.savings,'savings');
  if (tx.type === 'repay') {
    const sourceError = tx.method === 'cash' ? moneyTooLow(b.cash,'cash') : moneyTooLow(b.online,'online balance');
    if (sourceError) return sourceError;
    if (amount > priorBalances.owed + 0.0001) return 'Repayment is greater than the total outstanding debt.'
  }
  if (tx.type === 'lend') {
    return tx.method === 'cash' ? moneyTooLow(b.cash,'cash') : moneyTooLow(b.online,'online balance');
  }
  if (tx.type === 'lend_repay') {
    const sourceError = tx.method === 'cash' ? moneyTooLow(b.cash,'cash') : moneyTooLow(b.online,'online balance');
    if (sourceError) return sourceError;
    if (amount > priorBalances.receivable + 0.0001) return 'Recovery is greater than the total outstanding lending.';
  }
  if (b.cash < -0.0001) return 'This change would make your cash balance negative.';
  if (b.online < -0.0001) return 'This change would make your online balance negative.';
  if (b.savings < -0.0001) return 'This change would make your savings balance negative.';
  if (b.etransit < -0.0001) return 'This change would make your E-Transit balance negative.';
  return '';
}


function readGuestData(){
  if(typeof window==='undefined')return {transactions:[],customCategories:[],recurringRules:[],interactionCount:0};
  try{
    const raw=window.localStorage.getItem(GUEST_STORAGE_KEY);
    if(!raw)return {transactions:[],customCategories:[],recurringRules:[],interactionCount:0};
    const parsed=JSON.parse(raw)||{};
    return {
      transactions:normalizeTransactions(parsed.transactions),
      customCategories:normalizeCategories(parsed.customCategories),
      recurringRules:[],
      interactionCount:Math.max(0,Number(parsed.interactionCount)||0)
    };
  }catch{return {transactions:[],customCategories:[],recurringRules:[],interactionCount:0};}
}

function writeGuestData(data){
  if(typeof window==='undefined')return;
  try{
    window.localStorage.setItem(GUEST_STORAGE_KEY,JSON.stringify({
      transactions:data.transactions||[],
      customCategories:data.customCategories||[],
      interactionCount:Number(data.interactionCount)||0
    }));
  }catch{}
}

export function WalletProvider({children}){
  const pathname=usePathname();
  const [state,setState]=useState(EMPTY);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [toast,setToast]=useState('');
  const [toastClosing,setToastClosing]=useState(false);
  const [month,setMonth]=useState(()=>new Date().toISOString().slice(0,7));
  const [user,setUser]=useState(null);
  const [guestReady,setGuestReady]=useState(false);
  const [guestInteractions,setGuestInteractions]=useState(0);
  const [firstConfetti,setFirstConfetti]=useState(false);

  useEffect(()=>{
    let active=true;
    supabase.auth.getSession().then(({data})=>{
      if(active){setUser(data?.session?.user||null);setLoading(false);}
    }).catch(()=>active&&setLoading(false));
    const {data:l}=supabase.auth.onAuthStateChange((_,s)=>setUser(s?.user||null));
    return()=>{active=false;l?.subscription?.unsubscribe();};
  },[]);

  useEffect(()=>{
    if(user){setGuestReady(false);return;}
    const guest=readGuestData();
    setState(guest);
    setGuestInteractions(guest.interactionCount);
    setGuestReady(true);
  },[user]);

  useEffect(()=>{
    let dead=false;
    (async()=>{
      if(!user){
        if(!dead){setLoading(false);}
        return;
      }
      setLoading(true);
      const [{data:txRows,error:txError},{data:catRows,error:catError},{data:recurringRows,error:recurringError}] = await Promise.all([
        supabase.from('wallet_transactions').select('*').eq('user_id',user.id).order('date',{ascending:true}).order('created_at',{ascending:true}),
        supabase.from('wallet_categories').select('id,name,type,created_at').eq('user_id',user.id).order('created_at',{ascending:true}),
        supabase.from('wallet_recurring').select('*').eq('user_id',user.id).order('day_of_month',{ascending:true}).order('created_at',{ascending:true}),
      ]);
      if(dead)return;
      const transactions=(txRows||[]).map(rowToTransaction);
      const customCategories=(catRows||[]).map(c=>({id:c.id,name:c.name,type:c.type}));
      const recurringRules=(recurringRows||[]).map(rowToRecurring);
      setState({transactions,customCategories,recurringRules});
      if(txError||catError) setToast('Wallet storage is unavailable. Check your Supabase schema.');
      if(recurringError && !String(recurringError.message||'').toLowerCase().includes('wallet_recurring')) {
        setToast(recurringError.message||'Could not load recurring rules.');
      }
      setLoading(false);
    })();
    return()=>{dead=true;};
  },[user]);

  const notify = m => {
    setToastClosing(false);
    setToast(m);
    window.clearTimeout(window.__walletToastTimer);
    window.clearTimeout(window.__walletToastExitTimer);
    window.__walletToastTimer = window.setTimeout(()=>{
      setToastClosing(true);
      window.__walletToastExitTimer = window.setTimeout(()=>{
        setToast('');
        setToastClosing(false);
      },180);
    },2400);
  };

  function saveGuestState(nextState){
    setState(nextState);
    writeGuestData({...nextState,interactionCount:guestInteractions});
  }

  function guestGate(message='Create a free account to keep using Sultan Pocket.') {
    notify(message);
    window.dispatchEvent(new CustomEvent('wallet:guest-limit'));
  }

  async function add(tx){
    if(!user){
      if(!guestReady)return false;
      if(state.transactions.length>=GUEST_TRANSACTION_LIMIT){
        guestGate('Guest limit reached. Create a free account to save more transactions.');
        return false;
      }
      const id=tx.id||globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const nextTx={...tx,id,date:tx.date||todayISO()};
      const validation=getValidationMessage(nextTx,[...state.transactions,nextTx]);
      if(validation){notify(validation);return false;}
      const nextState={...state,transactions:[...state.transactions,nextTx]};
      if(state.transactions.length===0 && typeof window!=='undefined'){
        window.dispatchEvent(new CustomEvent('wallet:first-transaction'));
      }
      saveGuestState(nextState);
      notify(`Saved on this device · ${nextState.transactions.length}/${GUEST_TRANSACTION_LIMIT}`);
      return true;
    }
    const id=tx.id||globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const nextTx={...tx,id,date:tx.date||todayISO()};
    const validation=getValidationMessage(nextTx,[...state.transactions,nextTx]);
    if(validation){notify(validation);return false;}
    setSaving(true);
    const row=transactionRow(nextTx,user.id);
    const {data,error}=await supabase.from('wallet_transactions').insert(row).select('*').single();
    setSaving(false);
    if(error){notify(error.message||'Could not save this transaction.');return false;}
    const saved=rowToTransaction(data);
    if(state.transactions.length===0 && typeof window!=='undefined'){
      window.dispatchEvent(new CustomEvent('wallet:first-transaction'));
    }
    setState(prev=>({...prev,transactions:[...prev.transactions,saved]}));
    notify('Transaction saved');
    return true;
  }

  async function update(id,patch){
    if(!user){
      const current=state.transactions.find(t=>t.id===id);
      if(!current){notify('Transaction not found.');return false;}
      const replacement={...current,...patch,id};
      const transactions=state.transactions.map(t=>t.id===id?replacement:t);
      const validation=getValidationMessage(replacement,transactions);
      if(validation){notify(validation);return false;}
      saveGuestState({...state,transactions});
      notify('Guest transaction updated on this device');
      return true;
    }
    const current=state.transactions.find(t=>t.id===id);
    if(!current){notify('Transaction not found.');return false;}
    const replacement={...current,...patch,id};
    const transactions=state.transactions.map(t=>t.id===id?replacement:t);
    const validation=getValidationMessage(replacement,transactions);
    if(validation){notify(validation);return false;}
    setSaving(true);
    const expected=current.updated_at;
    let query=supabase.from('wallet_transactions').update(transactionRow(replacement,user.id)).eq('id',id).eq('user_id',user.id);
    if(expected) query=query.eq('updated_at',expected);
    const {data,error}=await query.select('*').maybeSingle();
    setSaving(false);
    if(error){notify(error.message||'Could not update this transaction.');return false;}
    if(!data){notify('This transaction changed elsewhere. Reload the Wallet and try again.');return false;}
    const saved=rowToTransaction(data);
    setState(prev=>({...prev,transactions:prev.transactions.map(t=>t.id===id?saved:t)}));
    notify('Transaction updated');
    return true;
  }

  async function remove(id){
    if(!user){
      const current=state.transactions.find(t=>t.id===id);
      if(!current){notify('Transaction not found.');return false;}
      saveGuestState({...state,transactions:state.transactions.filter(t=>t.id!==id)});
      notify('Guest transaction removed from this device');
      return true;
    }
    const current=state.transactions.find(t=>t.id===id);
    if(!current){notify('Transaction not found.');return false;}
    setSaving(true);
    let query=supabase.from('wallet_transactions').delete().eq('id',id).eq('user_id',user.id);
    if(current.updated_at) query=query.eq('updated_at',current.updated_at);
    const {data,error}=await query.select('id').maybeSingle();
    if(error){setSaving(false);notify(error.message||'Could not delete this transaction.');return false;}
    if(!data){setSaving(false);notify('This transaction changed elsewhere. Reload the Wallet and try again.');return false;}

    let attachmentError='';
    if(current.attachment_path){
      const {error:e}=await supabase.storage.from('wallet-attachments').remove([current.attachment_path]);
      if(e) attachmentError=e.message||'The transaction was deleted, but its attachment could not be removed.';
    }

    setSaving(false);
    setState(prev=>({...prev,transactions:prev.transactions.filter(t=>t.id!==id)}));
    notify(attachmentError||'Transaction deleted');
    return true;
  }

  async function importTransactions(rows){
    if(!user){
      const remaining=Math.max(0,GUEST_TRANSACTION_LIMIT-state.transactions.length);
      if(!remaining){guestGate('Guest limit reached. Create a free account to import more data.');return {imported:0,errors:[]};}
      const source=Array.isArray(rows)?rows.slice(0,remaining):[];
      const clean=source.map((tx,i)=>({...tx,id:tx.id||globalThis.crypto?.randomUUID?.()||`${Date.now()}-${i}`,amount:Number(tx.amount)||0,date:tx.date||todayISO()}));
      const valid=[],errors=[];
      const validTypes=new Set(['salary','income_other','expense','transfer','withdraw','savings_add','savings_use','etransit_add','transport','borrow','repay','lend','lend_repay']);
      for(let i=0;i<clean.length;i++){
        const tx=clean[i];
        if(!validTypes.has(tx.type)){errors.push({row:i+1,error:`Unknown transaction type \"${tx.type}\".`,data:tx});continue;}
        if(!Number.isFinite(Number(tx.amount))||Number(tx.amount)<=0){errors.push({row:i+1,error:'Amount must be a positive number.',data:tx});continue;}
        if(!/^\d{4}-\d{2}-\d{2}$/.test(String(tx.date))){errors.push({row:i+1,error:'Date must use YYYY-MM-DD.',data:tx});continue;}
        valid.push(tx);
      }
      const nextState={...state,transactions:[...state.transactions,...valid]};
      saveGuestState(nextState);
      if(valid.length)notify(`Imported ${valid.length} guest transaction${valid.length===1?'':'s'} on this device`);
      return {imported:valid.length,errors};
    }
    const clean=Array.isArray(rows)?rows.map((tx,i)=>({
      ...tx,
      id:tx.id||globalThis.crypto?.randomUUID?.()||`${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
      amount:Number(tx.amount)||0,
      date:tx.date||todayISO(),
    })):[];
    if(!clean.length)return {imported:0,errors:[]};
    const valid=[],errors=[];
    const validTypes=new Set(['salary','income_other','expense','transfer','withdraw','savings_add','savings_use','etransit_add','transport','borrow','repay','lend','lend_repay']);
    for(let i=0;i<clean.length;i++){
      const tx=clean[i];
      const row=i+1;
      if(!validTypes.has(tx.type)){errors.push({row,error:`Unknown transaction type \"${tx.type}\".`,data:tx});continue;}
      if(!Number.isFinite(Number(tx.amount))||Number(tx.amount)<=0){errors.push({row,error:'Amount must be a positive number.',data:tx});continue;}
      if(!/^\d{4}-\d{2}-\d{2}$/.test(String(tx.date))){errors.push({row,error:'Date must use YYYY-MM-DD.',data:tx});continue;}
      const d=new Date(`${tx.date}T00:00:00Z`);
      if(Number.isNaN(d.getTime())||d.toISOString().slice(0,10)!==tx.date){errors.push({row,error:'Date is invalid.',data:tx});continue;}
      valid.push(tx);
    }
    if(!valid.length){notify('No valid transactions to import.');return {imported:0,errors};}
    setSaving(true);
    const rowsToInsert=valid.map(tx=>transactionRow(tx,user.id));
    const {data,error}=await supabase.from('wallet_transactions').insert(rowsToInsert).select('*');
    setSaving(false);
    if(error){notify(error.message||'Could not import transactions.');return {imported:0,errors:[...errors,{row:0,error:error.message||'Import failed.'}]};}
    const saved=(data||[]).map(rowToTransaction);
    setState(prev=>({...prev,transactions:[...prev.transactions,...saved]}));
    notify(`${saved.length} transaction${saved.length===1?'':'s'} imported`);
    return {imported:saved.length,errors};
  }

  async function addRecurring(rule){
    if(!user){notify('Please sign in to save recurring rules.');return false;}
    const clean={...rule,amount:Number(rule.amount)||0,day_of_month:Number(rule.day_of_month)||1};
    if(clean.amount<=0){notify('Enter a valid recurring amount.');return false;}
    if(clean.day_of_month<1||clean.day_of_month>28){notify('Day of month must be between 1 and 28.');return false;}
    setSaving(true);
    const {data,error}=await supabase.from('wallet_recurring').insert(recurringRow(clean,user.id)).select('*').single();
    setSaving(false);
    if(error){notify(error.message||'Could not save recurring rule.');return false;}
    setState(prev=>({...prev,recurringRules:[...prev.recurringRules,rowToRecurring(data)]}));
    notify('Recurring rule saved');
    return true;
  }

  async function updateRecurring(id,patch){
    if(!user){notify('Please sign in to update recurring rules.');return false;}
    const current=(state.recurringRules||[]).find(r=>r.id===id);
    if(!current){notify('Recurring rule not found.');return false;}
    const replacement={...current,...patch,id};
    if(Number(replacement.amount)<=0){notify('Enter a valid recurring amount.');return false;}
    if(Number(replacement.day_of_month)<1||Number(replacement.day_of_month)>28){notify('Day of month must be between 1 and 28.');return false;}
    setSaving(true);
    const {data,error}=await supabase.from('wallet_recurring').update(recurringRow(replacement,user.id)).eq('id',id).eq('user_id',user.id).select('*').maybeSingle();
    setSaving(false);
    if(error||!data){notify(error?.message||'Could not update recurring rule.');return false;}
    setState(prev=>({...prev,recurringRules:prev.recurringRules.map(r=>r.id===id?rowToRecurring(data):r)}));
    notify('Recurring rule updated');
    return true;
  }

  async function removeRecurring(id){
    if(!user){notify('Please sign in to delete recurring rules.');return false;}
    setSaving(true);
    const {data,error}=await supabase.from('wallet_recurring').delete().eq('id',id).eq('user_id',user.id).select('id').maybeSingle();
    setSaving(false);
    if(error||!data){notify(error?.message||'Could not delete recurring rule.');return false;}
    setState(prev=>({...prev,recurringRules:prev.recurringRules.filter(r=>r.id!==id)}));
    notify('Recurring rule deleted');
    return true;
  }

  async function addCategory(name,type='expense'){
    if(!user){
      const clean=String(name||'').trim();
      if(!clean){notify('Enter a category name.');return false;}
      const normalized=type==='income'?'income':'expense';
      const exists=state.customCategories.some(c=>c.name.toLowerCase()===clean.toLowerCase()&&c.type===normalized);
      if(exists){notify('That category already exists.');return false;}
      const nextState={...state,customCategories:[...state.customCategories,{id:`guest-cat-${Date.now()}`,name:clean,type:normalized}]};
      saveGuestState(nextState);
      notify('Category saved on this device');
      return true;
    }
    const clean=String(name||'').trim();
    if(!clean){notify('Enter a category name.');return false;}
    const normalized=type==='income'?'income':'expense';
    const exists=state.customCategories.some(c=>c.name.toLowerCase()===clean.toLowerCase()&&c.type===normalized);
    if(exists){notify('That category already exists.');return false;}
    setSaving(true);
    const {data,error}=await supabase.from('wallet_categories').insert({user_id:user.id,name:clean,type:normalized}).select('id,name,type,created_at').single();
    setSaving(false);
    if(error){notify(error.message||'Could not save category.');return false;}
    setState(prev=>({...prev,customCategories:[...prev.customCategories,{id:data.id,name:data.name,type:data.type}]}));
    notify('Category saved');
    return true;
  }

  useEffect(()=>{
    const handler=()=>{
      if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
      setFirstConfetti(true);
    };
    window.addEventListener('wallet:first-transaction',handler);
    return()=>window.removeEventListener('wallet:first-transaction',handler);
  },[]);

  useEffect(()=>{
    if(!firstConfetti)return;
    const timer=setTimeout(()=>setFirstConfetti(false),3100);
    return()=>clearTimeout(timer);
  },[firstConfetti]);

  useEffect(()=>{
    if(user||!guestReady)return;
    const handleClick=event=>{
      const target=event.target;
      if(!(target instanceof Element)||!target.closest('.wallet-shell'))return;
      if(target.closest('.gate-modal')||target.closest('.wallet-toast'))return;
      setGuestInteractions(prev=>{
        if(prev>=GUEST_INTERACTION_LIMIT)return prev;
        const next=prev+1;
        writeGuestData({...state,interactionCount:next});
        if(next===GUEST_INTERACTION_LIMIT){
          window.dispatchEvent(new CustomEvent('wallet:guest-limit'));
        }
        return next;
      });
    };
    window.addEventListener('click',handleClick);
    return()=>window.removeEventListener('click',handleClick);
  },[user,guestReady,state]);

  const currency=user?.user_metadata?.currency||'PKR';
  const isGuest=!user;
  const guestLimitReached=state.transactions.length>=GUEST_TRANSACTION_LIMIT;
  const basePath=user?'/dashboard/expense-tracker':'/expense-tracker';

  const value=useMemo(()=>({
    state,user,loading,saving,toast,toastClosing,notify,add,update,remove,addCategory,
    addRecurring,updateRecurring,removeRecurring,
    month,setMonth,currency,demoTransactions:DEMO_TRANSACTIONS,guest:isGuest,guestLimitReached,guestTransactionsUsed:state.transactions.length,guestTransactionLimit:GUEST_TRANSACTION_LIMIT,guestInteractions,guestInteractionLimit:GUEST_INTERACTION_LIMIT,basePath
  }),[state,user,loading,saving,toast,toastClosing,month,currency]);

  return <C.Provider value={value}>
    {children}
    {firstConfetti&&<Confetti active={firstConfetti} onComplete={()=>setFirstConfetti(false)}/>}
    {toast&&<div className={`wallet-toast ${toastClosing ? "is-closing" : ""}`} role="status"><span className="wallet-toast-icon">{/(saved|added|updated|imported|created|completed|success)/i.test(toast)?'✓':'!'}</span><span>{toast}</span></div>}
  </C.Provider>;
}

export const useWallet=()=>useContext(C);

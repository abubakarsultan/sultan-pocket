'use client';

import {createContext,useContext,useEffect,useMemo,useState} from 'react';
import {supabase} from '@/lib/supabaseClient';
import {balances,todayISO} from '@/lib/wallet/calc';

const C = createContext(null);
const EMPTY = {transactions:[],customCategories:[]};

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
    details:tx,
  };
}

function getValidationMessage(tx, nextTransactions){
  const amount = Number(tx.amount)||0;
  if (amount <= 0) return 'Enter a valid amount.';
  if (!tx.date) return 'Select a date.';
  const b = balances(nextTransactions);
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
    if (amount > b.owed + 0.0001) return 'Repayment is greater than the total outstanding debt.';
  }
  if (b.cash < -0.0001) return 'This change would make your cash balance negative.';
  if (b.online < -0.0001) return 'This change would make your online balance negative.';
  if (b.savings < -0.0001) return 'This change would make your savings balance negative.';
  if (b.etransit < -0.0001) return 'This change would make your E-Transit balance negative.';
  return '';
}

export function WalletProvider({children}){
  const [state,setState]=useState(EMPTY);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [toast,setToast]=useState('');
  const [month,setMonth]=useState(()=>new Date().toISOString().slice(0,7));
  const [user,setUser]=useState(null);

  useEffect(()=>{
    let active=true;
    supabase.auth.getSession().then(({data})=>{
      if(active){setUser(data?.session?.user||null);setLoading(false);}
    }).catch(()=>active&&setLoading(false));
    const {data:l}=supabase.auth.onAuthStateChange((_,s)=>setUser(s?.user||null));
    return()=>{active=false;l?.subscription?.unsubscribe();};
  },[]);

  useEffect(()=>{
    let dead=false;
    (async()=>{
      if(!user){
        if(!dead){setState(EMPTY);setLoading(false);}
        return;
      }
      setLoading(true);
      const [{data:txRows,error:txError},{data:catRows,error:catError}] = await Promise.all([
        supabase.from('wallet_transactions').select('*').eq('user_id',user.id).order('date',{ascending:true}).order('created_at',{ascending:true}),
        supabase.from('wallet_categories').select('id,name,type,created_at').eq('user_id',user.id).order('created_at',{ascending:true}),
      ]);
      if(dead)return;
      const transactions=(txRows||[]).map(rowToTransaction);
      const customCategories=(catRows||[]).map(c=>({id:c.id,name:c.name,type:c.type}));
      setState({transactions,customCategories});
      if(txError||catError) setToast('Wallet storage is unavailable. Check your Supabase schema.');
      setLoading(false);
    })();
    return()=>{dead=true;};
  },[user]);

  const notify = m => {
    setToast(m);
    window.clearTimeout(window.__walletToastTimer);
    window.__walletToastTimer = window.setTimeout(()=>setToast(''),2400);
  };

  async function add(tx){
    if(!user){notify('Please sign in to save changes.');return false;}
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
    setState(prev=>({...prev,transactions:[...prev.transactions,saved]}));
    notify('Transaction saved');
    return true;
  }

  async function update(id,patch){
    if(!user){notify('Please sign in to save changes.');return false;}
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
    if(!user){notify('Please sign in to save changes.');return false;}
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

  async function addCategory(name,type='expense'){
    if(!user){notify('Please sign in to save categories.');return false;}
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

  const currency=user?.user_metadata?.currency||'PKR';

  const value=useMemo(()=>({
    state,user,loading,saving,toast,notify,add,update,remove,addCategory,
    month,setMonth,currency,demoTransactions:DEMO_TRANSACTIONS
  }),[state,user,loading,saving,toast,month,currency]);

  return <C.Provider value={value}>
    {children}
    {toast&&<div className="wallet-toast" role="status">{toast}</div>}
  </C.Provider>;
}

export const useWallet=()=>useContext(C);

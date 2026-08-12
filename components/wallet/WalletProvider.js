'use client';

import {createContext,useContext,useEffect,useMemo,useState} from 'react';
import {supabase} from '@/lib/supabaseClient';
import {balances,todayISO} from '@/lib/wallet/calc';

const C = createContext(null);
const EMPTY = {nextId:1,transactions:[],customCategories:[]};

const DEMO_TRANSACTIONS = [
  {id:1,type:'salary',amount:50000,date:'2026-08-01',category:'Monthly Salary',source:'Monthly Salary',method:'online',notes:'Demo income'},
  {id:2,type:'expense',amount:6500,date:'2026-08-02',category:'Food',method:'cash',notes:'Demo food expense'},
  {id:3,type:'expense',amount:2500,date:'2026-08-04',category:'Bills',method:'online',notes:'Demo bills'},
  {id:4,type:'transfer',amount:5000,date:'2026-08-05',from:'online',notes:'Demo transfer'},
  {id:5,type:'etransit_add',amount:1500,date:'2026-08-06',from:'online',notes:'Demo transport top-up'},
  {id:6,type:'expense',amount:420,date:'2026-08-07',category:'Transport',method:'etransit',notes:'Demo transport'},
  {id:7,type:'savings_add',amount:5000,date:'2026-08-08',method:'online',notes:'Demo savings'},
  {id:8,type:'borrow',amount:3000,date:'2026-08-09',person:'Demo Friend',method:'cash',repayRequired:true,notes:'Demo borrowing'},
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
    id:t.id ?? i+1,
    amount:Number(t.amount)||0,
    date:t.date || todayISO(),
  }));
}
function normalizeState(raw){
  const transactions = normalizeTransactions(raw?.transactions);
  const maxId = transactions.reduce((m,t)=>Math.max(m,Number(t.id)||0),0);
  return {
    ...EMPTY,
    ...(raw||{}),
    nextId:Math.max(Number(raw?.nextId)||1,maxId+1),
    transactions,
    customCategories:normalizeCategories(raw?.customCategories),
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
    return tx.from === 'cash' ? moneyTooLow(b.cash,'cash') : moneyTooLow(b.online,'online balance');
  }
  if (tx.type === 'etransit_add') return tx.from === 'cash' ? moneyTooLow(b.cash,'cash') : moneyTooLow(b.online,'online balance');
  if (tx.type === 'savings_add') return tx.method === 'cash' ? moneyTooLow(b.cash,'cash') : moneyTooLow(b.online,'online balance');
  if (tx.type === 'savings_use') return moneyTooLow(b.savings,'savings');
  if (tx.type === 'repay') {
    if (tx.method === 'cash') {
      const sourceError = moneyTooLow(b.cash,'cash');
      if (sourceError) return sourceError;
    } else {
      const sourceError = moneyTooLow(b.online,'online balance');
      if (sourceError) return sourceError;
    }
    const debt = b.owed;
    if (amount > debt + 0.0001) return 'Repayment is greater than the total outstanding debt.';
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
      const {data,error}=await supabase.from('wallet_data').select('data').eq('user_id',user.id).maybeSingle();
      if(!dead){
        const raw=data?.data;
        setState(error||!raw?EMPTY:normalizeState(raw));
        if(error) setToast('Wallet is ready locally. Saving will retry when available.');
        setLoading(false);
      }
    })();
    return()=>{dead=true;};
  },[user]);

  const notify = m => {
    setToast(m);
    window.clearTimeout(window.__walletToastTimer);
    window.__walletToastTimer = window.setTimeout(()=>setToast(''),2400);
  };

  async function persist(next,successMessage='Saved'){
    if(!user){notify('Please sign in to save changes.');return false;}
    const previous = state;
    setState(next);
    setSaving(true);
    const {error}=await supabase.from('wallet_data').upsert({
      user_id:user.id,
      data:next,
      updated_at:new Date().toISOString()
    });
    setSaving(false);
    if(error){
      setState(previous);
      notify('Could not save this change. Please try again.');
      return false;
    }
    notify(successMessage);
    return true;
  }

  function add(tx){
    const nextTx={...tx,id:state.nextId,date:tx.date||todayISO()};
    const validation=getValidationMessage(nextTx,[...state.transactions,nextTx]);
    if(validation){notify(validation);return false;}
    return persist(
      {...state,nextId:state.nextId+1,transactions:[...state.transactions,nextTx]},
      'Transaction saved'
    );
  }

  function update(id,patch){
    const replacement={...state.transactions.find(t=>t.id===id),...patch,id};
    const transactions=state.transactions.map(t=>t.id===id?replacement:t);
    const validation=getValidationMessage(replacement,transactions);
    if(validation){notify(validation);return false;}
    return persist({...state,transactions},'Transaction updated');
  }

  function remove(id){
    return persist(
      {...state,transactions:state.transactions.filter(t=>t.id!==id)},
      'Transaction deleted'
    );
  }

  function addCategory(name,type='expense'){
    const clean=String(name||'').trim();
    if(!clean){notify('Enter a category name.');return false;}
    const normalized=type==='income'?'income':'expense';
    const exists=state.customCategories.some(c=>c.name.toLowerCase()===clean.toLowerCase()&&c.type===normalized);
    if(exists){notify('That category already exists.');return false;}
    return persist(
      {...state,customCategories:[...normalizeCategories(state.customCategories),{name:clean,type:normalized}]},
      'Category saved'
    );
  }

  const value=useMemo(()=>({
    state,user,loading,saving,toast,notify,add,update,remove,addCategory,
    month,setMonth,demoTransactions:DEMO_TRANSACTIONS
  }),[state,user,loading,saving,toast,month]);

  return <C.Provider value={value}>
    {children}
    {toast&&<div className="wallet-toast" role="status">{toast}</div>}
  </C.Provider>;
}

export const useWallet=()=>useContext(C);

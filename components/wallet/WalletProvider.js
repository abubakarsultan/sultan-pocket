'use client';
import {createContext,useContext,useEffect,useMemo,useState} from 'react';
import {supabase} from '@/lib/supabaseClient';
import {todayISO} from '@/lib/wallet/calc';
const C=createContext(null);
const EMPTY={nextId:1,transactions:[],customCategories:[]};
export function WalletProvider({children}){
 const [state,setState]=useState(EMPTY),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[toast,setToast]=useState('');
 const [month,setMonth]=useState(()=>new Date().toISOString().slice(0,7));
 const [user,setUser]=useState(null);
 useEffect(()=>{supabase.auth.getSession().then(({data})=>{setUser(data.session?.user||null);setLoading(false);});const {data:l}=supabase.auth.onAuthStateChange((_,s)=>setUser(s?.user||null));return()=>l.subscription.unsubscribe()},[]);
 useEffect(()=>{let dead=false;(async()=>{if(!user){setState(EMPTY);return} setLoading(true);const {data,error}=await supabase.from('wallet_data').select('data').eq('user_id',user.id).maybeSingle();if(!dead)setState(error||!data?.data?EMPTY:{...EMPTY,...data.data});setLoading(false)})();return()=>{dead=true}},[user]);
 const notify=m=>{setToast(m);setTimeout(()=>setToast(''),2200)};
 async function persist(next){if(!user){notify('Sign in to save changes.');return false}setState(next);setSaving(true);const {error}=await supabase.from('wallet_data').upsert({user_id:user.id,data:next,updated_at:new Date().toISOString()});setSaving(false);if(error){notify('Could not save.');return false}notify('Saved');return true}
 function add(tx){const next={...state,nextId:state.nextId+1,transactions:[...state.transactions,{...tx,id:state.nextId,date:tx.date||todayISO()}]};return persist(next)}
 function update(id,patch){return persist({...state,transactions:state.transactions.map(t=>t.id===id?{...t,...patch}:t)})}
 function remove(id){return persist({...state,transactions:state.transactions.filter(t=>t.id!==id)})}
 const value=useMemo(()=>({state,user,loading,saving,toast,notify,add,update,remove,month,setMonth}),[state,user,loading,saving,toast,month]);
 return <C.Provider value={value}>{children}{toast&&<div className="wallet-toast">{toast}</div>}</C.Provider>
}
export const useWallet=()=>useContext(C);

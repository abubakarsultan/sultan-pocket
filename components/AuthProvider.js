'use client';

import {createContext,useContext,useEffect,useState} from 'react';
import {supabase} from '@/lib/supabaseClient';

const AuthContext=createContext({user:null,loading:true});

export function AuthProvider({children}){
  const [user,setUser]=useState(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    let active=true;
    supabase.auth.getSession()
      .then(({data:{session}})=>{
        if(active){setUser(session?.user??null);setLoading(false);}
      })
      .catch(()=>{
        if(active){setUser(null);setLoading(false);}
      });

    const {data:listener}=supabase.auth.onAuthStateChange((_event,session)=>{
      if(active)setUser(session?.user??null);
    });

    return()=>{
      active=false;
      listener?.subscription?.unsubscribe();
    };
  },[]);

  return <AuthContext.Provider value={{user,loading}}>{children}</AuthContext.Provider>;
}
export function useAuth(){return useContext(AuthContext);}

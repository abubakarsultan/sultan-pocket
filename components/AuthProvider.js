'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext({ user: null, loading: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function applySession(session) {
      const nextUser = session?.user ?? null;
      if (!nextUser) {
        if (active) setUser(null);
        return;
      }

      // Supabase auth-level bans block new sign-ins. This profile check also
      // removes an already-open client session after an admin suspends it.
      const { data: profile } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', nextUser.id)
        .maybeSingle();

      if (profile?.status === 'suspended') {
        await supabase.auth.signOut();
        if (active) setUser(null);
        return;
      }

      if (active) setUser(nextUser);
    }

    supabase.auth.getSession()
      .then(({ data: { session } }) => applySession(session))
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      // Do not block the auth callback with a database query. The initial
      // session check above handles the normal page-load case, while the
      // auth-level ban handles subsequent sign-in attempts.
      if (active) setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

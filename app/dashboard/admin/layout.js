'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import AdminShell from '@/components/admin/AdminShell';

export default function AdminLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState(null); // null = still checking

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/signin');
      return;
    }
    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        const r = data?.role || 'user';
        if (r === 'user') {
          router.replace('/dashboard');
        } else {
          setRole(r);
        }
      });
  }, [loading, user, router]);

  if (loading || !user || role === null) {
    return <main style={{ padding: 60, textAlign: 'center', color: 'var(--text-faint)' }}>Loading…</main>;
  }

  return <AdminShell role={role}>{children}</AdminShell>;
}

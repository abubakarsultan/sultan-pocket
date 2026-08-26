'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabaseClient';

export default function AdminBlogPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isEditor, setIsEditor] = useState(null);
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState('');

  const loadPosts = useCallback(async () => {
    const { data, error } = await supabase.from('posts').select('id,title,slug,excerpt,published,created_at,updated_at').order('created_at', { ascending: false });
    if (error) setError(error.message); else setPosts(data || []);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/signin'); return; }
    supabase.rpc('is_editor_or_admin').then(({ data }) => { setIsEditor(!!data); if (data) loadPosts(); });
  }, [loading, user, router, loadPosts]);

  async function deletePost(id) {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) setError(error.message); else loadPosts();
  }

  if (loading || isEditor === null || posts === null) return <main className="container" style={{ padding: 40 }}><div className="wallet-empty">Loading…</div></main>;
  if (!isEditor) return <main className="container" style={{ padding: 40 }}><div className="wallet-empty">You don't have access to this page.</div></main>;

  return (
    <main className="container admin-blog-list" style={{ padding: '40px 24px' }}>
      <div className="admin-page-head">
        <div><h1>Blog posts</h1><p>Manage every post from one clean list.</p></div>
        <Link href="/dashboard/admin/blog/new" className="btn btn-primary">+ New post</Link>
      </div>
      {error && <div className="form-error" style={{ marginBottom: 14 }}>{error}</div>}
      <div className="wallet-panel">
        <div className="wallet-panel-head"><h2>All posts</h2><span>{posts.length} total</span></div>
        <div className="wallet-table-wrap">
          <table className="wallet-table">
            <thead><tr><th>Post</th><th>Status</th><th>Created</th><th>Updated</th><th></th></tr></thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id}>
                  <td><div style={{ fontWeight: 650 }}>{p.title || 'Untitled'}</div><div style={{ fontSize: 11, color: 'var(--text-faint)' }}>/{p.slug}</div></td>
                  <td><span className="wallet-pill">{p.published ? 'Published' : 'Draft'}</span></td>
                  <td>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td>{p.updated_at ? new Date(p.updated_at).toLocaleDateString() : '—'}</td>
                  <td><div className="table-actions"><Link href={`/dashboard/admin/blog/edit/${p.id}`} className="table-action edit">Edit</Link><button className="table-action delete" onClick={() => deletePost(p.id)}>Delete</button></div></td>
                </tr>
              ))}
              {posts.length === 0 && <tr><td colSpan={5} className="wallet-empty">No posts yet. Create your first post.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

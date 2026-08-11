'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabaseClient';

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const emptyForm = { id: null, title: '', slug: '', excerpt: '', content: '', cover_image_url: '', published: false };

export default function AdminBlogPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(null);
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);

  const loadPosts = useCallback(async () => {
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    setPosts(data || []);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/signin'); return; }
    supabase.rpc('am_i_admin').then(({ data }) => {
      setIsAdmin(!!data);
      if (data) loadPosts();
    });
  }, [loading, user, router, loadPosts]);

  function startNew() {
    setForm(emptyForm);
    setSlugTouched(false);
    setError('');
  }

  function startEdit(post) {
    setForm(post);
    setSlugTouched(true);
    setError('');
  }

  function onTitleChange(title) {
    setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    if (!form.title || !form.slug || !form.content) {
      setError('Title, slug, and content are required.');
      return;
    }
    setBusy(true);
    const payload = {
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt,
      content: form.content,
      cover_image_url: form.cover_image_url,
      published: form.published,
      updated_at: new Date().toISOString(),
    };
    let res;
    if (form.id) {
      res = await supabase.from('posts').update(payload).eq('id', form.id);
    } else {
      res = await supabase.from('posts').insert({ ...payload, author_id: user.id });
    }
    setBusy(false);
    if (res.error) { setError(res.error.message); return; }
    startNew();
    loadPosts();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    await supabase.from('posts').delete().eq('id', id);
    loadPosts();
    if (form.id === id) startNew();
  }

  if (loading || isAdmin === null) {
    return <main style={{ padding: 60, textAlign: 'center', color: 'var(--text-faint)' }}>Loading…</main>;
  }
  if (!isAdmin) {
    return <main style={{ padding: 60, textAlign: 'center', color: 'var(--text-faint)' }}>You don't have access to this page.</main>;
  }

  return (
    <main className="container" style={{ padding: '40px 24px', display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 24 }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Blog admin</h1>
          <button className="btn btn-primary" onClick={startNew}>+ New post</button>
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          {posts.map((p) => (
            <div key={p.id} className="card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                    /{p.slug} · {p.published ? 'Published' : 'Draft'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => startEdit(p)}>Edit</button>
                  <button className="btn" style={{ padding: '5px 10px', fontSize: 12, color: 'var(--danger)' }} onClick={() => handleDelete(p.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
          {posts.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>No posts yet.</p>}
        </div>
      </div>

      <form onSubmit={handleSave} className="card">
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>{form.id ? 'Edit post' : 'New post'}</h2>
        {error && <div className="form-error" style={{ display: 'block' }}>{error}</div>}
        <div className="field">
          <label>Title</label>
          <input type="text" value={form.title} onChange={(e) => onTitleChange(e.target.value)} />
        </div>
        <div className="field">
          <label>Slug (URL)</label>
          <input type="text" value={form.slug} onChange={(e) => { setSlugTouched(true); setForm((f) => ({ ...f, slug: e.target.value })); }} />
        </div>
        <div className="field">
          <label>Excerpt (short summary)</label>
          <input type="text" value={form.excerpt || ''} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} />
        </div>
        <div className="field">
          <label>Cover image URL (optional)</label>
          <input type="text" value={form.cover_image_url || ''} onChange={(e) => setForm((f) => ({ ...f, cover_image_url: e.target.value }))} />
        </div>
        <div className="field">
          <label>Content</label>
          <textarea
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            rows={10}
            style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', fontSize: 14, color: 'var(--text)', resize: 'vertical' }}
          />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 16 }}>
          <input type="checkbox" checked={form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} />
          Published (visible on the public blog)
        </label>
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Saving…' : 'Save post'}</button>
      </form>
    </main>
  );
}

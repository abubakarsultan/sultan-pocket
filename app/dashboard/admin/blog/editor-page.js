'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import RichTextEditor from '@/components/admin/RichTextEditor';

const CATEGORIES = ['General', 'Budgeting', 'Savings', 'Debt', 'Guides', 'Product updates'];
function slugify(text) { return text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-'); }
function isSafeHttpUrl(value) { if (!value) return true; try { const u = new URL(value); return u.protocol === 'https:'; } catch { return false; } }
const emptyForm = { title: '', slug: '', excerpt: '', content: '', cover_image_url: '', category: 'General', meta_title: '', meta_description: '', published: false };

export default function BlogEditorPage({ mode }) {
  const router = useRouter();
  const params = useParams();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(mode === 'edit');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [slugTouched, setSlugTouched] = useState(mode === 'edit');

  useEffect(() => {
    if (mode !== 'edit') return;
    const id = params?.id;
    if (!id) return;
    supabase.from('posts').select('*').eq('id', id).maybeSingle().then(({ data, error }) => {
      if (error || !data) setError(error?.message || 'Post not found.');
      else setForm({ title: data.title || '', slug: data.slug || '', excerpt: data.excerpt || '', content: data.content || '', cover_image_url: data.cover_image_url || '', category: data.category || 'General', meta_title: data.meta_title || '', meta_description: data.meta_description || '', published: !!data.published });
      setLoading(false);
    });
  }, [mode, params]);

  function update(key, value) { setForm(f => ({ ...f, [key]: value })); }

  async function save(e) {
    e.preventDefault(); setError('');
    if (!form.title.trim() || !form.slug.trim() || !form.content.replace(/<[^>]*>/g, '').trim()) { setError('Title, slug, and content are required.'); return; }
    if (!isSafeHttpUrl(form.cover_image_url.trim())) { setError('Cover image URL must be a valid HTTPS URL.'); return; }
    if (form.meta_title.length > 70) { setError('SEO title should be 70 characters or fewer.'); return; }
    if (form.meta_description.length > 170) { setError('SEO description should be 170 characters or fewer.'); return; }
    setBusy(true);
    const { data: auth } = await supabase.auth.getUser();
    const payload = { ...form, title: form.title.trim(), slug: form.slug.trim(), updated_at: new Date().toISOString() };
    let result;
    if (mode === 'edit') result = await supabase.from('posts').update(payload).eq('id', params.id).select('id').maybeSingle();
    else result = await supabase.from('posts').insert({ ...payload, author_id: auth?.user?.id }).select('id').single();
    setBusy(false);
    if (result.error) { setError(result.error.message); return; }
    try { await fetch('/api/admin/sitemap-refresh', { method: 'POST' }); } catch {}
    router.push('/dashboard/admin/blog');
  }

  if (loading) return <main className="container" style={{ padding: 40 }}><div className="wallet-empty">Loading post…</div></main>;

  return (
    <main className="container admin-blog-editor" style={{ padding: '28px 24px 70px' }}>
      <div className="editor-topbar">
        <div><Link href="/dashboard/admin/blog" className="back-link">← All posts</Link><h1>{mode === 'edit' ? 'Edit post' : 'New post'}</h1></div>
        <div className="editor-actions"><Link href="/dashboard/admin/blog" className="btn">Cancel</Link><button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save post'}</button></div>
      </div>
      {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}
      <form onSubmit={save}>
        <section className="editor-paper">
          <div className="editor-title-fields">
            <input className="editor-title-input" value={form.title} onChange={(e) => { const title = e.target.value; update('title', title); if (!slugTouched) update('slug', slugify(title)); }} placeholder="Post title" />
            <input className="editor-slug-input" value={form.slug} onChange={(e) => { setSlugTouched(true); update('slug', e.target.value); }} placeholder="post-url-slug" />
          </div>
          <RichTextEditor value={form.content} onChange={(content) => update('content', content)} />
        </section>
        <section className="editor-settings wallet-panel">
          <div className="editor-settings-head"><div><h2>Post settings</h2><p>Details used on the blog listing, sharing, and search engines.</p></div><label className="publish-toggle"><input type="checkbox" checked={form.published} onChange={(e) => update('published', e.target.checked)} /><span>Published</span></label></div>
          <div className="editor-settings-grid">
            <div className="field"><label>Excerpt</label><textarea value={form.excerpt} onChange={(e) => update('excerpt', e.target.value)} placeholder="Short summary shown on the blog page" /></div>
            <div className="field"><label>Category</label><select value={form.category} onChange={(e) => update('category', e.target.value)}>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
            <div className="field"><label>Cover image URL</label><input value={form.cover_image_url} onChange={(e) => update('cover_image_url', e.target.value)} placeholder="https://…" /></div>
            <div className="field"><label>SEO title</label><input value={form.meta_title} onChange={(e) => update('meta_title', e.target.value)} placeholder="Falls back to post title" /></div>
            <div className="field"><label>SEO description</label><textarea value={form.meta_description} onChange={(e) => update('meta_description', e.target.value)} placeholder="Falls back to excerpt" /></div>
          </div>
        </section>
      </form>
    </main>
  );
}

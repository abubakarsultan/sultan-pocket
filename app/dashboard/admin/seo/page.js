'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AdminSeoPage() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    supabase.from('site_settings').select('*').eq('id', 1).maybeSingle().then(({ data, error: loadError }) => {
      if (loadError) setError(loadError.message);
      setForm(data || { site_title: '', site_description: '', og_image_url: '' });
    });
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true); setError(''); setNotice('');
    const { error } = await supabase
      .from('site_settings')
      .update({
        site_title: form.site_title,
        site_description: form.site_description,
        og_image_url: form.og_image_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);
    setSaving(false);
    if (error) setError(error.message);
    else setNotice('Saved.');
  }

  async function refreshSitemap() {
    setRefreshing(true); setError(''); setNotice('');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error('Your session has expired. Please sign in again.');

      const res = await fetch('/api/admin/sitemap-refresh', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Could not refresh sitemap.');
      setNotice('Sitemap refreshed successfully.');
    } catch (e) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  }

  if (!form) return <div className="wallet-empty">Loading…</div>;

  return (
    <div className="wallet-panel" style={{ maxWidth: 640 }}>
      <h2>Site-wide SEO</h2>
      <p style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 6 }}>
        Used as the default title, description, and social preview image
        wherever a page doesn't set its own. Blog posts can override these values.
      </p>
      <form onSubmit={handleSave} style={{ paddingTop: 14 }}>
        <div className="field">
          <label htmlFor="seo-site-title">Site title</label>
          <input id="seo-site-title" value={form.site_title || ''} onChange={(e) => setForm({ ...form, site_title: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="seo-site-description">Site description</label>
          <textarea id="seo-site-description" value={form.site_description || ''} onChange={(e) => setForm({ ...form, site_description: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="seo-og-image">Social preview image URL</label>
          <input id="seo-og-image" value={form.og_image_url || ''} onChange={(e) => setForm({ ...form, og_image_url: e.target.value })} placeholder="https://sultanpocket.online/og-image.png" />
        </div>
        {error && <div className="form-error">{error}</div>}
        {notice && <div className="form-notice">{notice}</div>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" disabled={saving} type="submit">{saving ? 'Saving…' : 'Save SEO settings'}</button>
          <button type="button" className="btn" disabled={refreshing} onClick={refreshSitemap}>{refreshing ? 'Refreshing…' : '↻ Refresh sitemap now'}</button>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 10 }}>
          Published blog posts are generated automatically. Saving a blog post also requests a sitemap refresh; this button is available when you want to force it manually.
        </p>
      </form>
    </div>
  );
}

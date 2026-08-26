'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const PUBLIC_PAGES = [
  ['/', 'Home'], ['/services', 'Features & Services'], ['/about', 'About'], ['/blog', 'Blog'], ['/faq', 'FAQ'], ['/contact', 'Contact'], ['/privacy', 'Privacy Policy'], ['/terms', 'Terms of Service'],
];
const DEFAULTS = { title:'',description:'',canonical_url:'',og_title:'',og_description:'',og_image_url:'',twitter_title:'',twitter_description:'',twitter_image_url:'',keywords:'',robots_index:true,robots_follow:true,include_in_sitemap:true,priority:0.7,change_frequency:'weekly' };

export default function AdminSeoPage() {
  const [pages, setPages] = useState([]);
  const [active, setActive] = useState('/');
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [site, setSite] = useState({ site_title:'', site_description:'', og_image_url:'', instagram_url:'', facebook_url:'', x_url:'', linkedin_url:'' });
  const [siteSaving, setSiteSaving] = useState(false);

  useEffect(() => {
    supabase.from('site_settings').select('site_title,site_description,og_image_url,instagram_url,facebook_url,x_url,linkedin_url').eq('id',1).maybeSingle().then(({ data }) => { if (data) setSite(data); });
    supabase.from('page_seo').select('*').order('path').then(({ data, error: e }) => {
      if (e) { setError(e.message); return; }
      setPages(PUBLIC_PAGES.map(([path, label]) => ({ path, label, ...DEFAULTS, ...(data || []).find(row => row.path === path) })));
    });
  }, []);

  const page = pages.find(p => p.path === active);
  function update(key, value) { setPages(list => list.map(p => p.path === active ? { ...p, [key]: value } : p)); }

  async function save(e) {
    e.preventDefault(); if (!page) return; setSaving(true); setError(''); setNotice('');
    if (page.title.length > 70) { setError('Meta title should be 70 characters or fewer.'); setSaving(false); return; }
    if (page.description.length > 170) { setError('Meta description should be 170 characters or fewer.'); setSaving(false); return; }
    if (page.canonical_url) { try { if (new URL(page.canonical_url).protocol !== 'https:') throw new Error(); } catch { setError('Canonical URL must be a valid HTTPS URL.'); setSaving(false); return; } }
    if (page.og_image_url) { try { if (new URL(page.og_image_url).protocol !== 'https:') throw new Error(); } catch { setError('OG image must be a valid HTTPS URL.'); setSaving(false); return; } }
    const payload = { ...page, updated_at: new Date().toISOString() }; delete payload.label;
    const { error: e } = await supabase.from('page_seo').upsert(payload, { onConflict: 'path' });
    setSaving(false); if (e) setError(e.message); else setNotice(`${page.label} SEO settings saved.`);
  }

  async function saveSiteDefaults(e) {
    e.preventDefault(); setSiteSaving(true); setError(''); setNotice('');
    for (const [label, value] of [['Instagram',site.instagram_url],['Facebook',site.facebook_url],['X',site.x_url],['LinkedIn',site.linkedin_url]]) { if (!value) continue; try { if (new URL(value).protocol !== 'https:') throw new Error(); } catch { setError(`${label} URL must be a valid HTTPS URL.`); setSiteSaving(false); return; } }
    const { error: e } = await supabase.from('site_settings').update({ ...site, updated_at:new Date().toISOString() }).eq('id',1);
    setSiteSaving(false); if (e) setError(e.message); else setNotice('Global SEO defaults saved.');
  }

  async function refreshSitemap() {
    setRefreshing(true); setError(''); setNotice('');
    try { const res = await fetch('/api/admin/sitemap-refresh', { method:'POST' }); const json = await res.json(); if (!res.ok || !json.ok) throw new Error(json.error || 'Could not refresh sitemap.'); setNotice('Sitemap refreshed.'); }
    catch (e) { setError(e.message); } finally { setRefreshing(false); }
  }

  if (!pages.length) return <div className="wallet-empty">Loading SEO settings…</div>;

  return <div className="seo-manager">
    <div className="seo-manager-head"><div><h2>SEO control center</h2><p>Manage the search and social metadata for every public page included in your sitemap.</p></div><button className="btn btn-primary" onClick={refreshSitemap} disabled={refreshing}>{refreshing ? 'Refreshing…' : '↻ Refresh sitemap'}</button></div>
    <form className="wallet-panel seo-global-panel" onSubmit={saveSiteDefaults}>
      <div><h3>Global defaults</h3><p>Fallback values used when a page has not set its own metadata.</p></div>
      <div className="seo-fields"><div className="field"><label>Default site title</label><input value={site.site_title||''} onChange={e=>setSite({...site,site_title:e.target.value})} /></div><div className="field"><label>Default site description</label><textarea value={site.site_description||''} onChange={e=>setSite({...site,site_description:e.target.value})} /></div><div className="field"><label>Default social image URL</label><input value={site.og_image_url||''} onChange={e=>setSite({...site,og_image_url:e.target.value})} placeholder="https://…" /></div><div className="field"><label>Instagram URL</label><input value={site.instagram_url||''} onChange={e=>setSite({...site,instagram_url:e.target.value})} placeholder="https://instagram.com/…" /></div><div className="field"><label>Facebook URL</label><input value={site.facebook_url||''} onChange={e=>setSite({...site,facebook_url:e.target.value})} placeholder="https://facebook.com/…" /></div><div className="field"><label>X / Twitter URL</label><input value={site.x_url||''} onChange={e=>setSite({...site,x_url:e.target.value})} placeholder="https://x.com/…" /></div><div className="field"><label>LinkedIn URL</label><input value={site.linkedin_url||''} onChange={e=>setSite({...site,linkedin_url:e.target.value})} placeholder="https://linkedin.com/company/…" /></div></div>
      <button className="btn" disabled={siteSaving}>{siteSaving?'Saving…':'Save global defaults'}</button>
    </form>
    <div className="seo-layout">
      <aside className="seo-page-list" aria-label="Public pages">{pages.map(p => <button key={p.path} type="button" className={active === p.path ? 'active' : ''} onClick={() => { setActive(p.path); setError(''); setNotice(''); }}><strong>{p.label}</strong><small>{p.path}</small><span className={p.include_in_sitemap && p.robots_index ? 'seo-dot good' : 'seo-dot muted'} /></button>)}</aside>
      <form className="seo-form wallet-panel" onSubmit={save}>
        <div className="seo-form-head"><div><span className="section-label">PAGE SEO</span><h3>{page.label}</h3><code>{page.path}</code></div><div className="seo-status">{page.include_in_sitemap && page.robots_index ? 'Indexable' : 'Not indexed'}</div></div>
        <section><h4>Search result</h4><div className="seo-fields"><div className="field"><label>Meta title</label><input value={page.title} onChange={e=>update('title',e.target.value)} placeholder="Page title for Google" /><small>{page.title.length}/70</small></div><div className="field"><label>Meta description</label><textarea value={page.description} onChange={e=>update('description',e.target.value)} placeholder="Short description for search results" /><small>{page.description.length}/170</small></div><div className="field"><label>Canonical URL</label><input value={page.canonical_url || ''} onChange={e=>update('canonical_url',e.target.value)} placeholder="https://sultanpocket.online/page" /></div><div className="field"><label>Keywords <span className="optional">optional</span></label><input value={page.keywords || ''} onChange={e=>update('keywords',e.target.value)} placeholder="comma, separated, keywords" /></div></div></section>
        <section><h4>Social sharing</h4><div className="seo-fields"><div className="field"><label>Open Graph title</label><input value={page.og_title || ''} onChange={e=>update('og_title',e.target.value)} /></div><div className="field"><label>Open Graph description</label><textarea value={page.og_description || ''} onChange={e=>update('og_description',e.target.value)} /></div><div className="field"><label>Open Graph image URL</label><input value={page.og_image_url || ''} onChange={e=>update('og_image_url',e.target.value)} placeholder="https://…" /></div><div className="field"><label>Twitter title</label><input value={page.twitter_title || ''} onChange={e=>update('twitter_title',e.target.value)} /></div><div className="field"><label>Twitter description</label><textarea value={page.twitter_description || ''} onChange={e=>update('twitter_description',e.target.value)} /></div><div className="field"><label>Twitter image URL</label><input value={page.twitter_image_url || ''} onChange={e=>update('twitter_image_url',e.target.value)} placeholder="https://…" /></div></div></section>
        <section><h4>Indexing & sitemap</h4><div className="seo-switch-grid"><label><input type="checkbox" checked={!!page.robots_index} onChange={e=>update('robots_index',e.target.checked)} /> Allow search engines to index this page</label><label><input type="checkbox" checked={!!page.robots_follow} onChange={e=>update('robots_follow',e.target.checked)} /> Allow search engines to follow links</label><label><input type="checkbox" checked={!!page.include_in_sitemap} onChange={e=>update('include_in_sitemap',e.target.checked)} /> Include this page in sitemap</label></div><div className="seo-small-grid"><div className="field"><label>Sitemap priority</label><select value={page.priority} onChange={e=>update('priority',Number(e.target.value))}>{[1,0.9,0.8,0.7,0.6,0.5,0.4,0.3].map(v=><option key={v} value={v}>{v.toFixed(1)}</option>)}</select></div><div className="field"><label>Change frequency</label><select value={page.change_frequency} onChange={e=>update('change_frequency',e.target.value)}>{['always','hourly','daily','weekly','monthly','yearly','never'].map(v=><option key={v}>{v}</option>)}</select></div></div></section>
        {error && <div className="form-error">{error}</div>}{notice && <div className="form-notice">{notice}</div>}
        <div className="seo-form-actions"><button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : `Save ${page.label} SEO`}</button><button type="button" className="btn" onClick={refreshSitemap} disabled={refreshing}>Refresh sitemap</button></div>
      </form>
    </div>
  </div>;
}

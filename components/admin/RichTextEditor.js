'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const FONT_FAMILIES = ['Arial', 'Georgia', 'Times New Roman', 'Verdana', 'Trebuchet MS', 'Courier New'];
const FONT_SIZES = [8, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48];
const TEXT_COLORS = ['#111111', '#444444', '#0057FF', '#D92D20', '#087443', '#7A3E00', '#7F56D9', '#FFFFFF'];
const HIGHLIGHTS = ['#FFFFFF', '#F3F4F6', '#FFF2CC', '#E8F1FF', '#E9F7EF', '#FCE8E6', '#F3E8FF', '#000000'];
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

function ToolbarButton({ children, title, onClick }) {
  return <button type="button" title={title} onMouseDown={(e) => { e.preventDefault(); onClick(); }} className="rte-btn">{children}</button>;
}

function ColorMenu({ label, title, colors, onPick }) {
  const [open, setOpen] = useState(false);
  return <div className="rte-color-wrap">
    <button type="button" title={title} className="rte-color-btn" onMouseDown={(e) => { e.preventDefault(); setOpen(v => !v); }}><span>{label}</span><i style={{ background: colors[2] }} /></button>
    {open && <div className="rte-color-menu">{colors.map((color) => <button key={color} type="button" title={color} style={{ background: color }} onMouseDown={(e) => { e.preventDefault(); onPick(color); setOpen(false); }} />)}</div>}
  </div>;
}

function TableDialog({ onInsert, onClose }) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [cellColor, setCellColor] = useState('#FFFFFF');
  return <div className="rte-dialog-backdrop" onMouseDown={onClose}>
    <div className="rte-dialog" onMouseDown={(e) => e.stopPropagation()}>
      <h3>Insert table</h3>
      <div className="rte-dialog-grid">
        <label>Rows<input type="number" min="1" max="20" value={rows} onChange={(e) => setRows(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} /></label>
        <label>Columns<input type="number" min="1" max="12" value={cols} onChange={(e) => setCols(Math.max(1, Math.min(12, Number(e.target.value) || 1)))} /></label>
      </div>
      <label>Cell background<input type="color" value={cellColor} onChange={(e) => setCellColor(e.target.value)} /></label>
      <div className="rte-dialog-actions"><button type="button" className="btn" onClick={onClose}>Cancel</button><button type="button" className="btn btn-primary" onClick={() => onInsert(rows, cols, cellColor)}>Insert table</button></div>
    </div>
  </div>;
}

function ImageDialog({ onInsertUrl, onInsertFile, onClose, busy }) {
  const [url, setUrl] = useState('');
  const inputRef = useRef(null);
  function choose(e) { const file = e.target.files?.[0]; if (file) onInsertFile(file); e.target.value = ''; }
  return <div className="rte-dialog-backdrop" onMouseDown={onClose}>
    <div className="rte-dialog" onMouseDown={(e) => e.stopPropagation()}>
      <h3>Insert image</h3>
      <label>Image URL<input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" /></label>
      <button type="button" className="rte-upload-choice" onClick={() => inputRef.current?.click()} disabled={busy}>▣ {busy ? 'Uploading…' : 'Upload from device'}</button>
      <input ref={inputRef} hidden type="file" accept={IMAGE_TYPES.join(',')} onChange={choose} />
      <div className="rte-dialog-actions"><button type="button" className="btn" onClick={onClose}>Cancel</button><button type="button" className="btn btn-primary" disabled={!url.trim()} onClick={() => onInsertUrl(url.trim())}>Insert URL</button></div>
      <p className="rte-help">JPG, PNG, WEBP or GIF · maximum 10MB for uploads.</p>
    </div>
  </div>;
}

export default function RichTextEditor({ value, onChange }) {
  const editorRef = useRef(null);
  const savedRange = useRef(null);
  const [tableOpen, setTableOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [html, setHtml] = useState(value || '');

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== (value || '')) editorRef.current.innerHTML = value || '';
  }, [value]);

  function sync() { const next = editorRef.current?.innerHTML || ''; setHtml(next); onChange(next); }
  function saveSelection() { const sel = window.getSelection(); if (sel && sel.rangeCount && editorRef.current?.contains(sel.anchorNode)) savedRange.current = sel.getRangeAt(0); }
  function restoreSelection() { const sel = window.getSelection(); if (!sel || !savedRange.current) { editorRef.current?.focus(); return; } sel.removeAllRanges(); sel.addRange(savedRange.current); editorRef.current?.focus(); }
  function command(cmd, arg = null) { restoreSelection(); document.execCommand(cmd, false, arg); sync(); saveSelection(); }
  function insertLink() { saveSelection(); const url = window.prompt('Link URL', 'https://'); if (!url) return; command('createLink', url); }
  function insertImageHtml(url) { restoreSelection(); const safe = url.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); document.execCommand('insertHTML', false, `<img src="${safe}" alt="" />`); sync(); saveSelection(); setImageOpen(false); }
  function insertTable(rows, cols, color) { restoreSelection(); let table = '<table><tbody>'; for (let r = 0; r < rows; r++) { table += '<tr>'; for (let c = 0; c < cols; c++) table += `<td style="background-color:${color}"><br></td>`; table += '</tr>'; } table += '</tbody></table><p><br></p>'; document.execCommand('insertHTML', false, table); sync(); setTableOpen(false); }

  async function uploadImage(file) {
    if (!IMAGE_TYPES.includes(file.type)) { alert('Please choose a JPG, PNG, WEBP, or GIF image.'); return; }
    if (file.size > MAX_IMAGE_SIZE) { alert('Image must be 10MB or smaller.'); return; }
    setUploading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) throw new Error('Please sign in again.');
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const path = `blog/${auth.user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('blog-media').upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from('blog-media').getPublicUrl(path);
      insertImageHtml(data.publicUrl);
    } catch (e) { alert(e.message || 'Could not upload image.'); }
    finally { setUploading(false); }
  }

  return <div className="rte-shell">
    <div className="rte-toolbar" onMouseDown={saveSelection}>
      <ToolbarButton title="Undo" onClick={() => command('undo')}>↶</ToolbarButton><ToolbarButton title="Redo" onClick={() => command('redo')}>↷</ToolbarButton><span className="rte-divider" />
      <select title="Text style" className="rte-select" defaultValue="p" onChange={(e) => command('formatBlock', e.target.value)}><option value="p">Normal text</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option><option value="blockquote">Quote</option></select>
      <select title="Font" className="rte-select" defaultValue="Arial" onChange={(e) => command('fontName', e.target.value)}>{FONT_FAMILIES.map(f => <option key={f}>{f}</option>)}</select>
      <select title="Font size" className="rte-size" defaultValue="3" onChange={(e) => command('fontSize', e.target.value)}>{FONT_SIZES.map((s, i) => <option key={s} value={i < 7 ? String(i + 1) : '7'}>{s}</option>)}</select>
      <ToolbarButton title="Bold" onClick={() => command('bold')}>B</ToolbarButton><ToolbarButton title="Italic" onClick={() => command('italic')}>I</ToolbarButton><ToolbarButton title="Underline" onClick={() => command('underline')}>U</ToolbarButton>
      <ColorMenu label="A" title="Text color" colors={TEXT_COLORS} onPick={(c) => command('foreColor', c)} /><ColorMenu label="▰" title="Highlight color" colors={HIGHLIGHTS} onPick={(c) => command('hiliteColor', c)} />
      <ToolbarButton title="Align left" onClick={() => command('justifyLeft')}>≡</ToolbarButton><ToolbarButton title="Center" onClick={() => command('justifyCenter')}>≡</ToolbarButton><ToolbarButton title="Align right" onClick={() => command('justifyRight')}>≡</ToolbarButton>
      <ToolbarButton title="Bulleted list" onClick={() => command('insertUnorderedList')}>•☰</ToolbarButton><ToolbarButton title="Numbered list" onClick={() => command('insertOrderedList')}>1☰</ToolbarButton><ToolbarButton title="Decrease indent" onClick={() => command('outdent')}>←</ToolbarButton><ToolbarButton title="Increase indent" onClick={() => command('indent')}>→</ToolbarButton>
      <ToolbarButton title="Link" onClick={insertLink}>🔗</ToolbarButton><ToolbarButton title="Image" onClick={() => { saveSelection(); setImageOpen(true); }}>▧</ToolbarButton><ToolbarButton title="Insert table" onClick={() => { saveSelection(); setTableOpen(true); }}>▦</ToolbarButton><ToolbarButton title="Clear formatting" onClick={() => command('removeFormat')}>Tx</ToolbarButton>
    </div>
    <div ref={editorRef} className="rte-page" contentEditable suppressContentEditableWarning onInput={sync} onKeyUp={saveSelection} onMouseUp={saveSelection} data-placeholder="Start writing your post…" />
    <input type="hidden" value={html} readOnly aria-hidden="true" />
    {tableOpen && <TableDialog onInsert={insertTable} onClose={() => setTableOpen(false)} />}
    {imageOpen && <ImageDialog busy={uploading} onClose={() => !uploading && setImageOpen(false)} onInsertUrl={insertImageHtml} onInsertFile={uploadImage} />}
  </div>;
}

const ALLOWED_TAGS = new Set([
  'p','br','div','span','font','h1','h2','h3','h4','h5','h6','strong','b','em','i','u','s',
  'ul','ol','li','blockquote','pre','code','a','img','hr','table','thead','tbody','tfoot',
  'tr','th','td','colgroup','col','mark'
]);
const VOID_TAGS = new Set(['br','img','hr','col']);
const ATTRS = {
  '*': new Set(['title','class','style','align']),
  a: new Set(['href','target','rel','title']),
  img: new Set(['src','alt','title','width','height']),
  font: new Set(['face','size','color']),
  td: new Set(['colspan','rowspan','style','align']),
  th: new Set(['colspan','rowspan','style','align']),
  col: new Set(['span','width']),
};
const SAFE_STYLE = new Set(['color','background-color','font-family','font-size','font-weight','font-style','text-decoration','text-align','vertical-align','margin-left','padding-left']);

function safeUrl(value, image=false) {
  const v = String(value || '').trim();
  if (!v) return '';
  try {
    const url = new URL(v, 'https://sultanpocket.online');
    const allowed = image ? ['https:'] : ['https:','http:','mailto:'];
    return allowed.includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}

function cleanStyle(style) {
  const output=[];
  for (const part of String(style || '').split(';')) {
    const idx=part.indexOf(':');
    if(idx<0) continue;
    const prop=part.slice(0,idx).trim().toLowerCase();
    const value=part.slice(idx+1).trim();
    if(!SAFE_STYLE.has(prop) || /url\s*\(|expression\s*\(|javascript\s*:|vbscript\s*:/i.test(value)) continue;
    output.push(`${prop}:${value}`);
  }
  return output.join(';');
}

function cleanAttrs(tag, raw) {
  const allowed = new Set([...(ATTRS['*']||[]), ...(ATTRS[tag]||[])]);
  const attrs=[];
  const re=/([:\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m;
  while((m=re.exec(raw))){
    const name=m[1].toLowerCase();
    if(!allowed.has(name) || name.startsWith('on')) continue;
    let value=m[2] ?? m[3] ?? m[4] ?? '';
    if(name==='style') value=cleanStyle(value);
    if(name==='href') value=safeUrl(value,false);
    if(name==='src') value=safeUrl(value,true);
    if(name==='target') value=value==='_blank'?'_blank':'';
    if(name==='rel') value='noopener noreferrer';
    if((name==='href'||name==='src') && !value) continue;
    if(name==='style' && !value) continue;
    attrs.push(` ${name}="${String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;') }"`);
  }
  if(tag==='a' && attrs.some(x=>x.includes('target="_blank"')) && !attrs.some(x=>x.startsWith(' rel='))) attrs.push(' rel="noopener noreferrer"');
  return attrs.join('');
}

export function sanitizeHtml(input='') {
  let html=String(input || '');
  html=html.replace(/<!--[\s\S]*?-->/g,'');
  html=html.replace(/<(script|iframe|object|embed|style|form|textarea|select|button|svg|math)\b[\s\S]*?<\/\1\s*>/gi,'');
  html=html.replace(/<(script|iframe|object|embed|style|form|textarea|select|button|svg|math)\b[^>]*\/?\s*>/gi,'');
  return html.replace(/<\/?([a-z0-9]+)([^>]*)>/gi,(full,name,rawAttrs)=>{
    const tag=name.toLowerCase();
    if(!ALLOWED_TAGS.has(tag)) return '';
    if(full.startsWith('</')) return `</${tag}>`;
    return `<${tag}${cleanAttrs(tag,rawAttrs)}${VOID_TAGS.has(tag)?' />':'>'}`;
  });
}

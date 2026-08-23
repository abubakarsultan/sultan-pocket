'use client';

import { useRef, useState } from 'react';
import { marked } from 'marked';

const TOOLS = [
  { label: 'B', title: 'Bold', wrap: ['**', '**'] },
  { label: 'I', title: 'Italic', wrap: ['_', '_'] },
  { label: 'H2', title: 'Heading', wrap: ['## ', ''], line: true },
  { label: '”', title: 'Quote', wrap: ['> ', ''], line: true },
  { label: '•', title: 'Bullet list', wrap: ['- ', ''], line: true },
  { label: '1.', title: 'Numbered list', wrap: ['1. ', ''], line: true },
  { label: '🔗', title: 'Link', wrap: ['[', '](https://)'] },
  { label: '🖼', title: 'Image', wrap: ['![alt text](', ')'] },
  { label: '</>', title: 'Code', wrap: ['`', '`'] },
];

marked.setOptions({ breaks: true });

export default function MarkdownEditor({ value, onChange, rows = 14 }) {
  const textareaRef = useRef(null);
  const [showPreview, setShowPreview] = useState(false);

  function applyTool(tool) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = value.slice(0, start);
    const selected = value.slice(start, end);
    const after = value.slice(end);
    const [prefix, suffix] = tool.wrap;

    let next, cursorStart, cursorEnd;
    if (tool.line) {
      // Line-level tools (heading/quote/list) go at the start of the current line.
      const lineStart = before.lastIndexOf('\n') + 1;
      next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
      cursorStart = cursorEnd = start + prefix.length;
    } else {
      next = before + prefix + (selected || tool.title) + suffix + after;
      cursorStart = start + prefix.length;
      cursorEnd = cursorStart + (selected || tool.title).length;
    }

    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursorStart, cursorEnd);
    });
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
        {TOOLS.map((tool) => (
          <button
            key={tool.title}
            type="button"
            title={tool.title}
            onClick={() => applyTool(tool)}
            className="btn"
            style={{ padding: '4px 9px', fontSize: 12, minWidth: 30 }}
          >
            {tool.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          className="btn"
          style={{ padding: '4px 10px', fontSize: 12, marginLeft: 'auto' }}
        >
          {showPreview ? 'Write' : 'Preview'}
        </button>
      </div>

      {showPreview ? (
        <div
          className="blog-content"
          style={{
            minHeight: rows * 22,
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '12px 14px',
            fontSize: 14,
          }}
          dangerouslySetInnerHTML={{ __html: marked.parse(value || '*Nothing to preview yet.*') }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder="Write in Markdown — use the toolbar above, or type **bold**, _italic_, [link](https://...), etc."
          style={{
            width: '100%',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '10px 12px',
            fontSize: 14,
            color: 'var(--text)',
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />
      )}
      <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 6 }}>
        Formatted with Markdown. Select text and click a toolbar button, or write it directly.
      </p>
    </div>
  );
}

import sanitizeHtml from 'sanitize-html';

const allowedTags = [
  'p', 'br', 'div', 'span', 'strong', 'b', 'em', 'i', 'u', 's',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote',
  'ul', 'ol', 'li', 'a', 'img', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  'pre', 'code', 'hr', 'sup', 'sub'
];

const allowedAttributes = {
  a: ['href', 'target', 'rel', 'title'],
  img: ['src', 'alt', 'title', 'width', 'height'],
  td: ['colspan', 'rowspan', 'style'],
  th: ['colspan', 'rowspan', 'style'],
  span: ['style'],
  p: ['style'],
  div: ['style'],
  table: ['style'],
  tr: ['style']
};

const allowedStyles = {
  '*': {
    'color': [/^#[0-9a-f]{3,8}$/i, /^rgb\([^)]*\)$/i, /^rgba\([^)]*\)$/i],
    'background-color': [/^#[0-9a-f]{3,8}$/i, /^rgb\([^)]*\)$/i, /^rgba\([^)]*\)$/i],
    'text-align': [/^(left|right|center|justify)$/],
    'font-family': [/^[a-z0-9 ,'-]+$/i],
    'font-size': [/^\d+(px|pt|em|rem|%)$/i],
    'font-weight': [/^(normal|bold|[1-9]00)$/i],
    'font-style': [/^(normal|italic|oblique)$/i],
    'text-decoration': [/^[a-z -]+$/i]
  }
};

export function sanitizeBlogHtml(html = '') {
  return sanitizeHtml(String(html), {
    allowedTags,
    allowedAttributes,
    allowedStyles,
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      img: ['http', 'https']
    },
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          target: '_blank',
          rel: 'noopener noreferrer'
        }
      })
    }
  });
}

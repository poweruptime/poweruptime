import sanitizeHtml, {IOptions} from 'sanitize-html';

export const TINY_MCE_SANITIZE_OPTIONS: IOptions = {
  allowedTags: [
    // blocks
    'p',
    'div',
    'br',
    'blockquote',
    'pre',
    'code',

    // headings
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',

    // inline formatting
    'span',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'strike',
    'sub',
    'sup',

    // links/images
    'a',
    'img',

    // lists
    'ul',
    'ol',
    'li',

    // tables
    'table',
    'thead',
    'tbody',
    'tfoot',
    'tr',
    'td',
    'th',
    'caption',
    'colgroup',
    'col',
  ],

  allowedAttributes: {
    '*': ['style', 'title', 'aria-label'],

    a: ['href', 'name', 'target', 'rel', 'title'],

    img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading'],

    table: ['width', 'height', 'border', 'cellpadding', 'cellspacing'],

    td: ['width', 'height', 'colspan', 'rowspan'],

    th: ['width', 'height', 'colspan', 'rowspan', 'scope'],

    col: ['width', 'span'],
  },

  allowedStyles: {
    '*': {
      // TinyMCE text color/background color
      color: [
        /^#[0-9a-f]{3,8}$/i,
        /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i,
        /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0|1|0?\.\d+)\s*\)$/i,
      ],
      'background-color': [
        /^#[0-9a-f]{3,8}$/i,
        /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i,
        /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0|1|0?\.\d+)\s*\)$/i,
      ],

      // alignment / indentation / typography
      'text-align': [/^(left|right|center|justify)$/],
      'font-weight': [/^(normal|bold|bolder|lighter|[1-9]00)$/],
      'font-style': [/^(normal|italic|oblique)$/],
      'text-decoration': [/^(none|underline|line-through|underline line-through)$/],
      'font-size': [/^\d+(\.\d+)?(px|pt|em|rem|%)$/],
      'line-height': [/^(normal|\d+(\.\d+)?(px|pt|em|rem|%)?)$/],
      'margin-left': [/^\d+(\.\d+)?(px|pt|em|rem|%)$/],
      'padding-left': [/^\d+(\.\d+)?(px|pt|em|rem|%)$/],

      // list styles from advlist/lists
      'list-style-type': [
        /^(disc|circle|square|decimal|decimal-leading-zero|lower-alpha|upper-alpha|lower-roman|upper-roman|none)$/i,
      ],

      // table/image sizing
      width: [/^(auto|\d+(\.\d+)?(px|em|rem|%)?)$/],
      height: [/^(auto|\d+(\.\d+)?(px|em|rem|%)?)$/],
      'max-width': [/^(none|\d+(\.\d+)?(px|em|rem|%)?)$/],

      // tables
      'border-collapse': [/^(collapse|separate)$/],
      border: [/^\d+px\s+(solid|dashed|dotted)\s+(#[0-9a-f]{3,8}|rgb\([^)]+\)|rgba\([^)]+\))$/i],
      'border-width': [/^\d+(\.\d+)?px$/],
      'border-style': [/^(none|solid|dashed|dotted|double)$/],
      'border-color': [/^#[0-9a-f]{3,8}$/i, /^rgb\([^)]+\)$/i, /^rgba\([^)]+\)$/i],
      padding: [/^\d+(\.\d+)?(px|pt|em|rem|%)$/],
      'vertical-align': [/^(baseline|top|middle|bottom|text-top|text-bottom)$/],
    },
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: {
    img: ['http', 'https', 'data'],
  },

  allowedSchemesAppliedToAttributes: ['href', 'src', 'cite'],

  allowProtocolRelative: false,

  transformTags: {
    a: sanitizeHtml.simpleTransform('a', {
      rel: 'noopener noreferrer',
    }),
  },
};

export const globalStylesCss = {
  '*': {
    fontFamily: '$sans',
  },
  // from base.css
  '*,\n        ::before,\n        ::after': {
    boxSizing: 'border-box',
    borderWidth: '0',
    borderStyle: 'solid',
  },
  html: {
    lineHeight: 1.5,
    WebkitTextSizeAdjust: '100%',
    MozTabSize: '4',
    tabSize: 4,
  },
  body: {
    margin: '0',
    lineHeight: 'inherit',
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans',\n    'Droid Sans', 'Helvetica Neue', sans-serif",
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  },
  hr: { height: '0', color: 'inherit', borderTopWidth: '1px' },
  'abbr:where([title])': { textDecoration: 'underline dotted' },
  'h1,\n        h2,\n        h3,\n        h4,\n        h5,\n        h6': {
    fontSize: 'inherit',
    fontWeight: 'inherit',
  },
  a: { color: 'inherit', textDecoration: 'inherit' },
  'b,\n        strong': { fontWeight: 'bolder' },
  small: { fontSize: '80%' },
  'sub,\n        sup': {
    fontSize: '75%',
    lineHeight: 0,
    position: 'relative',
    verticalAlign: 'baseline',
  },
  sub: { bottom: '-0.25em' },
  sup: { top: '-0.5em' },
  table: {
    textIndent: '0',
    borderColor: 'inherit',
    borderCollapse: 'collapse',
  },
  'button,\n        input,\n        optgroup,\n        select,\n        textarea': {
    fontFamily: 'inherit',
    fontSize: '100%',
    lineHeight: 'inherit',
    color: 'inherit',
    margin: '0',
    padding: '0',
  },
  'button,\n        select': { textTransform: 'none' },
  "button,\n        [type='button'],\n        [type='reset'],\n        [type='submit']": {
    WebkitAppearance: 'button',
    backgroundColor: 'transparent',
    backgroundImage: 'none',
    border: 'none',
  },
  ':-moz-focusring': { outline: 'auto' },
  ':-moz-ui-invalid': { boxShadow: 'none' },
  progress: { verticalAlign: 'baseline' },
  '::-webkit-inner-spin-button,\n        ::-webkit-outer-spin-button': {
    height: 'auto',
  },
  "[type='search']": { WebkitAppearance: 'textfield', outlineOffset: '-2px' },
  '::-webkit-search-decoration': { WebkitAppearance: 'none' },
  '::-webkit-file-upload-button': {
    WebkitAppearance: 'button',
    font: 'inherit',
  },
  summary: { display: 'list-item' },
  'blockquote,\n        dl,\n        dd,\n        h1,\n        h2,\n        h3,\n        h4,\n        h5,\n        h6,\n        hr,\n        figure,\n        p,\n        pre':
    {
      margin: '0',
    },
  fieldset: { margin: '0', padding: '0' },
  legend: { padding: '0' },
  'ol,\n        ul,\n        menu': {
    listStyle: 'none',
    margin: '0',
    padding: '0',
  },
  textarea: { resize: 'vertical' },
  'input::placeholder,\n        textarea::placeholder': { opacity: 1 },
  "button,\n        [role='button']": { cursor: 'pointer' },
  ':disabled': { cursor: 'default' },
  'img,\n        svg,\n        video,\n        canvas,\n        audio,\n        iframe,\n        embed,\n        object':
    {
      display: 'block',
      verticalAlign: 'middle',
    },
  'img,\n        video': { maxWidth: '100%', height: 'auto' },
  '[hidden]': { display: 'none' },

  // from index.css
  'html,\nbody,\n#root': { height: '100%' },
  '#root': { overscrollBehaviorY: 'none' },
  '::-webkit-scrollbar-track': {
    WebkitBoxShadow: 'inset 0 0 6px rgba(0, 0, 0, 0.3)',
    boxShadow: 'inset 0 0 6px rgba(0, 0, 0, 0.3)',
    backgroundColor: 'transparent',
  },
  '::-webkit-scrollbar': {
    width: '6px',
    height: '6px',
    backgroundColor: 'transparent',
  },
  '::-webkit-scrollbar-thumb': {
    backgroundColor: '#657080',
    borderRadius: '5px',
  },
  'code,\nkbd,\nsamp,\npre': {
    fontFamily: "source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace",
  },
  ':focus': { outline: 'none' },
  '#hls-viewer-dark:fullscreen': { backgroundColor: 'black !important' },
  '#hls-viewer-light:fullscreen': { backgroundColor: 'white !important' },
};

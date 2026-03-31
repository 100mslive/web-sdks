import type { SVGProps } from 'react';
import * as React from 'react';
const SvgChatUnreadIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M20 13.167v2.262a1.63 1.63 0 0 1-1.633 1.632h-6.64L7.985 19.87a.653.653 0 0 1-1.045-.522V17.06H5.633A1.633 1.633 0 0 1 4 15.43V5.633A1.633 1.633 0 0 1 5.633 4h5.2q-.271.625-.42 1.306h-4.78a.327.327 0 0 0-.327.327v9.796a.327.327 0 0 0 .327.326h1.959c.36 0 .653.292.653.653v1.633l2.873-2.155a.65.65 0 0 1 .392-.13h6.857a.327.327 0 0 0 .327-.327v-1.843q.68-.147 1.306-.42"
      clipRule="evenodd"
    />
    <rect width={10} height={10} x={12} y={2} fill="#2F80FF" rx={5} />
  </svg>
);
export default SvgChatUnreadIcon;

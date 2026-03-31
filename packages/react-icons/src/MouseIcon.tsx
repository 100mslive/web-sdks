import type { SVGProps } from 'react';
import * as React from 'react';
const SvgMouseIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M5.231 5.231a.79.79 0 0 1 .862-.17l13.42 5.581a.79.79 0 0 1-.047 1.476l-5.49 1.88-1.857 5.466a.79.79 0 0 1-1.477.05L5.061 6.093a.79.79 0 0 1 .17-.862m2.022 2.022 4.044 9.722 1.308-3.853a.79.79 0 0 1 .492-.493l3.885-1.33z"
      clipRule="evenodd"
    />
  </svg>
);
export default SvgMouseIcon;

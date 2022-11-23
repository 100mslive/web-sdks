import * as React from 'react';
import { SVGProps } from 'react';
const SvgMouseIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.231 5.231a.79.79 0 0 1 .862-.17l13.42 5.581a.79.79 0 0 1-.047 1.476l-5.49 1.88-1.857 5.466a.79.79 0 0 1-1.477.05L5.061 6.093a.79.79 0 0 1 .17-.862Zm2.022 2.022 4.043 9.722 1.31-3.853a.79.79 0 0 1 .491-.493l3.885-1.33-9.729-4.046Z"
      fill="currentColor"
    />
  </svg>
);
export default SvgMouseIcon;

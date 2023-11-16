import * as React from 'react';
import { SVGProps } from 'react';
const SvgCardIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M3 9.75h19M4.9 5h15.2c1.05 0 1.9.85 1.9 1.9v9.5a1.9 1.9 0 0 1-1.9 1.9H4.9A1.9 1.9 0 0 1 3 16.4V6.9C3 5.85 3.85 5 4.9 5Z"
      stroke="currentColor"
      strokeOpacity={0.95}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default SvgCardIcon;

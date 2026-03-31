import type { SVGProps } from 'react';
import * as React from 'react';
const SvgCardWithCvcIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeOpacity={0.95}
      strokeWidth={1.5}
      d="M3 9.75h19M4.9 5h15.2c1.05 0 1.9.85 1.9 1.9v9.5a1.9 1.9 0 0 1-1.9 1.9H4.9A1.9 1.9 0 0 1 3 16.4V6.9C3 5.85 3.85 5 4.9 5"
    />
    <path
      fill="currentColor"
      d="M18.293 12.293a1 1 0 1 1 1.414 1.414 1 1 0 0 1-1.414-1.414M15.793 12.293a1 1 0 1 1 1.414 1.414 1 1 0 0 1-1.414-1.414M13.293 12.293a1 1 0 1 1 1.414 1.414 1 1 0 0 1-1.414-1.414"
    />
  </svg>
);
export default SvgCardWithCvcIcon;

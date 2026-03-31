import type { SVGProps } from 'react';
import * as React from 'react';
const SvgShareIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M18.867 7.2H13a2.133 2.133 0 0 0-2.133 2.133V12"
    />
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="m15.667 10.4 3.2-3.2-3.2-3.2M16.733 13.6v5.333A1.067 1.067 0 0 1 15.667 20h-9.6A1.067 1.067 0 0 1 5 18.933V10.4a1.067 1.067 0 0 1 1.067-1.067h1.6"
    />
  </svg>
);
export default SvgShareIcon;

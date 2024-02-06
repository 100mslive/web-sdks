import * as React from 'react';
import { SVGProps } from 'react';
const SvgShareIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M18.867 7.2H13a2.133 2.133 0 0 0-2.133 2.133V12"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="m15.667 10.4 3.2-3.2-3.2-3.2M16.733 13.6v5.333A1.067 1.067 0 0 1 15.667 20h-9.6A1.067 1.067 0 0 1 5 18.933V10.4a1.067 1.067 0 0 1 1.067-1.067h1.6"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default SvgShareIcon;

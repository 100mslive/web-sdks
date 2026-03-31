import type { SVGProps } from 'react';
import * as React from 'react';
const SvgQuizIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="none" viewBox="0 0 40 40" {...props}>
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="m15.5 20.5 3 3 6-6" />
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={3}
      d="M9.5 13c0-1.65 1.35-3 3-3h15a3 3 0 0 1 3 3v18h-21zM35 31H5"
    />
  </svg>
);
export default SvgQuizIcon;

import * as React from 'react';
import { SVGProps } from 'react';
const SvgQuizIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24px" height="24px" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="m15.5 20.5 3 3 6-6" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M9.5 13c0-1.65 1.35-3 3-3h15a3 3 0 0 1 3 3v18h-21V13ZM35 31H5"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default SvgQuizIcon;

import * as React from 'react';
import { SVGProps } from 'react';
const SvgPersonIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24px" height="24px" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.533 5.333a1.6 1.6 0 1 1 3.2 0 1.6 1.6 0 0 1-3.2 0Zm1.6-2.666a2.667 2.667 0 1 0 0 5.333 2.667 2.667 0 0 0 0-5.333ZM6 9.067a2.667 2.667 0 0 0-2.667 2.666V12.8a.533.533 0 1 0 1.067 0v-1.067a1.6 1.6 0 0 1 1.6-1.6h4.267a1.6 1.6 0 0 1 1.6 1.6V12.8a.533.533 0 1 0 1.066 0v-1.067a2.667 2.667 0 0 0-2.666-2.666H6Z"
      fill="currentColor"
    />
  </svg>
);
export default SvgPersonIcon;

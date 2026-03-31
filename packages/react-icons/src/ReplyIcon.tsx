import type { SVGProps } from 'react';
import * as React from 'react';
const SvgReplyIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="none" viewBox="0 0 20 20" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M8.385 11.77 5 8.386 8.385 5"
    />
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M5 8.385h7.11a3.724 3.724 0 0 1 0 7.448H9.74"
    />
  </svg>
);
export default SvgReplyIcon;

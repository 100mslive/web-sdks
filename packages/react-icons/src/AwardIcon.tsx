import * as React from 'react';
import { SVGProps } from 'react';
const SvgAwardIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.5 9a4.5 4.5 0 1 1 6.999 3.743.74.74 0 0 0-.122.079A4.5 4.5 0 0 1 7.5 9Zm6.74 5.568A5.982 5.982 0 0 1 12 15a5.984 5.984 0 0 1-2.239-.432l-.563 4.238 2.416-1.45a.75.75 0 0 1 .772 0l2.416 1.45-.563-4.238Zm-5.885-.802a6 6 0 1 1 7.292 0l.846 6.385a.75.75 0 0 1-1.129.742L12 18.875l-3.364 2.018a.75.75 0 0 1-1.13-.742l.849-6.385Z"
      fill="currentColor"
    />
  </svg>
);
export default SvgAwardIcon;

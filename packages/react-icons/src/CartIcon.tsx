import type { SVGProps } from 'react';
import * as React from 'react';
const SvgCartIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M2.833 2a.833.833 0 0 0 0 1.667h2.65l.694 3.462.014.07 1.392 6.956a2.5 2.5 0 0 0 2.49 2.012h8.087a2.5 2.5 0 0 0 2.49-2.013l1.335-6.998a.833.833 0 0 0-.818-.99H7.684l-.7-3.496A.83.83 0 0 0 6.167 2zm6.384 11.83-1.2-5.997H20.16l-1.144 5.999a.83.83 0 0 1-.832.668H10.05a.83.83 0 0 1-.834-.67M7.833 19.5a1.667 1.667 0 1 1 3.334 0 1.667 1.667 0 0 1-3.334 0m9.167 0a1.667 1.667 0 1 1 3.333 0 1.667 1.667 0 0 1-3.333 0"
      clipRule="evenodd"
    />
  </svg>
);
export default SvgCartIcon;

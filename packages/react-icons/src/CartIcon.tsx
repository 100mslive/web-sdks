import * as React from 'react';
import { SVGProps } from 'react';
const SvgCartIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2.833 2a.833.833 0 0 0 0 1.667h2.65l.694 3.462a.827.827 0 0 0 .014.07l1.392 6.956a2.5 2.5 0 0 0 2.49 2.012h8.087a2.5 2.5 0 0 0 2.49-2.013l1.335-6.998a.833.833 0 0 0-.818-.99H7.684l-.7-3.496A.833.833 0 0 0 6.167 2H2.833Zm6.384 11.83-1.2-5.997H20.16l-1.144 5.999a.833.833 0 0 1-.832.668H10.05a.833.833 0 0 1-.834-.67ZM7.833 19.5a1.667 1.667 0 1 1 3.334 0 1.667 1.667 0 0 1-3.334 0Zm9.167 0a1.667 1.667 0 1 1 3.333 0 1.667 1.667 0 0 1-3.333 0Z"
      fill="currentColor"
    />
  </svg>
);
export default SvgCartIcon;

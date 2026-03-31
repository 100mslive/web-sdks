import type { SVGProps } from 'react';
import * as React from 'react';
const SvgMoveIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M6.851 8.967c.32.32.32.838 0 1.157L4.975 12l1.876 1.876a.818.818 0 0 1-1.157 1.157L3.24 12.58a.82.82 0 0 1 0-1.158l2.454-2.454a.82.82 0 0 1 1.157 0M11.422 3.24a.82.82 0 0 1 1.156 0l2.455 2.454a.818.818 0 0 1-1.157 1.157L12 4.975l-1.876 1.876a.818.818 0 0 1-1.157-1.157zM8.967 17.149a.82.82 0 0 1 1.157 0L12 19.025l1.876-1.876a.818.818 0 0 1 1.157 1.157L12.58 20.76a.82.82 0 0 1-1.158 0l-2.454-2.454a.82.82 0 0 1 0-1.157M17.149 8.967a.82.82 0 0 1 1.157 0l2.454 2.454c.32.32.32.838 0 1.158l-2.454 2.454a.818.818 0 0 1-1.157-1.157L19.025 12l-1.876-1.876a.82.82 0 0 1 0-1.157"
      clipRule="evenodd"
    />
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M3 12c0-.452.366-.818.818-.818h16.364a.818.818 0 1 1 0 1.636H3.818A.82.82 0 0 1 3 12"
      clipRule="evenodd"
    />
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M12 3c.452 0 .818.366.818.818v16.364a.818.818 0 1 1-1.636 0V3.818c0-.452.366-.818.818-.818"
      clipRule="evenodd"
    />
  </svg>
);
export default SvgMoveIcon;

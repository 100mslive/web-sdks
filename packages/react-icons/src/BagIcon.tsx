import * as React from 'react';
import { SVGProps } from 'react';
const SvgBagIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.618 3.327A.818.818 0 0 1 7.273 3h9.818c.257 0 .5.121.654.327l2.45 3.266c.106.138.169.31.169.498v11.454A2.455 2.455 0 0 1 17.909 21H6.455A2.455 2.455 0 0 1 4 18.546V7.09c0-.188.063-.36.17-.498l2.448-3.266Zm10.064 1.31 1.227 1.636H6.455l1.227-1.637h9ZM5.636 18.545V7.909h13.091v10.637a.818.818 0 0 1-.818.818H6.455a.818.818 0 0 1-.819-.819Zm4.091-8.182a.818.818 0 0 0-1.636 0 4.09 4.09 0 1 0 8.182 0 .818.818 0 0 0-1.637 0 2.454 2.454 0 1 1-4.909 0Z"
      fill="currentColor"
    />
  </svg>
);
export default SvgBagIcon;

import type { SVGProps } from 'react';
import * as React from 'react';
const SvgServerIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M6.91 7.637c0-.402.325-.728.726-.728h.008a.727.727 0 0 1 0 1.455h-.008a.727.727 0 0 1-.727-.727"
    />
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M6.182 4A2.18 2.18 0 0 0 4 6.182V9.09c0 1.205.977 2.182 2.182 2.182h11.636A2.18 2.18 0 0 0 20 9.09V6.18A2.18 2.18 0 0 0 17.818 4zm-.727 2.182c0-.402.325-.727.727-.727h11.636c.402 0 .727.325.727.727V9.09a.727.727 0 0 1-.727.727H6.182a.727.727 0 0 1-.727-.727z"
      clipRule="evenodd"
    />
    <path fill="currentColor" d="M7.636 15.636a.727.727 0 1 0 0 1.455h.008a.727.727 0 0 0 0-1.455z" />
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M6.182 12.728A2.18 2.18 0 0 0 4 14.909v2.91C4 19.022 4.977 20 6.182 20h11.636A2.18 2.18 0 0 0 20 17.818V14.91a2.18 2.18 0 0 0-2.182-2.182zm-.727 2.181c0-.401.325-.727.727-.727h11.636c.402 0 .727.326.727.727v2.91a.727.727 0 0 1-.727.727H6.182a.727.727 0 0 1-.727-.728z"
      clipRule="evenodd"
    />
  </svg>
);
export default SvgServerIcon;

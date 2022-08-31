import * as React from 'react';
import { SVGProps } from 'react';

const SvgServerIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24px" height="24px" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M2.91 3.637c0-.402.325-.728.726-.728h.008a.727.727 0 0 1 0 1.455h-.008a.727.727 0 0 1-.727-.727Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2.182 0A2.182 2.182 0 0 0 0 2.182V5.09c0 1.205.977 2.182 2.182 2.182h11.636A2.182 2.182 0 0 0 16 5.09V2.18A2.182 2.182 0 0 0 13.818 0H2.182Zm-.727 2.182c0-.402.325-.727.727-.727h11.636c.402 0 .728.325.728.727V5.09a.727.727 0 0 1-.728.727H2.182a.727.727 0 0 1-.727-.727V2.18Z"
      fill="currentColor"
    />
    <path d="M3.636 11.636a.727.727 0 1 0 0 1.455h.008a.727.727 0 0 0 0-1.455h-.008Z" fill="currentColor" />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2.182 8.727A2.182 2.182 0 0 0 0 10.91v2.91C0 15.022.977 16 2.182 16h11.636A2.182 2.182 0 0 0 16 13.818V10.91a2.182 2.182 0 0 0-2.182-2.182H2.182Zm-.727 2.182c0-.401.325-.727.727-.727h11.636c.402 0 .728.326.728.727v2.91a.727.727 0 0 1-.728.727H2.182a.727.727 0 0 1-.727-.728V10.91Z"
      fill="currentColor"
    />
  </svg>
);

export default SvgServerIcon;

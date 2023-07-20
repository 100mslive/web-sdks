import * as React from 'react';
import { SVGProps } from 'react';
const SvgMobileIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.636 5.455c0-.452.367-.819.819-.819h8.181c.452 0 .819.367.819.819v13.09a.818.818 0 0 1-.819.819H7.455a.818.818 0 0 1-.819-.819V5.456ZM7.455 3A2.455 2.455 0 0 0 5 5.455v13.09A2.455 2.455 0 0 0 7.455 21h8.181a2.454 2.454 0 0 0 2.455-2.454V5.455A2.455 2.455 0 0 0 15.636 3H7.455Zm4.09 13.09a.818.818 0 1 0 0 1.637h.009a.818.818 0 0 0 0-1.636h-.008Z"
      fill="currentColor"
    />
  </svg>
);
export default SvgMobileIcon;

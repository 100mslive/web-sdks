import * as React from 'react';
import { SVGProps } from 'react';
const SvgDesktopIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.455 5.636a.818.818 0 0 0-.819.819v8.181c0 .452.367.819.819.819h13.09a.818.818 0 0 0 .819-.819V6.455a.818.818 0 0 0-.819-.819H5.456ZM3 6.455A2.455 2.455 0 0 1 5.455 4h13.09A2.455 2.455 0 0 1 21 6.455v8.181a2.454 2.454 0 0 1-2.454 2.455h-5.728v1.636h2.455a.818.818 0 1 1 0 1.637H8.727a.818.818 0 1 1 0-1.637h2.455v-1.636H5.455A2.455 2.455 0 0 1 3 14.636V6.455Z"
      fill="currentColor"
    />
  </svg>
);
export default SvgDesktopIcon;

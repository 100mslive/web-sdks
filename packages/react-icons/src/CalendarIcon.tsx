import * as React from 'react';
import { SVGProps } from 'react';
const SvgCalendarIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M16.273 3.818a.818.818 0 1 0-1.637 0v.818H9.727v-.818a.818.818 0 0 0-1.636 0v.818H6.455A2.455 2.455 0 0 0 4 7.091V18.545A2.455 2.455 0 0 0 6.455 21h11.454a2.454 2.454 0 0 0 2.455-2.455V7.091a2.455 2.455 0 0 0-2.455-2.455h-1.636v-.818Zm2.454 5.727V7.091a.818.818 0 0 0-.818-.818h-1.636v.818a.818.818 0 1 1-1.637 0v-.818H9.727v.818a.818.818 0 0 1-1.636 0v-.818H6.455a.818.818 0 0 0-.819.818v2.454h13.091Zm-13.09 1.637h13.09v7.363a.818.818 0 0 1-.818.819H6.455a.818.818 0 0 1-.819-.819v-7.363Z"
      fill="currentColor"
    />
  </svg>
);
export default SvgCalendarIcon;

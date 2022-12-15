import * as React from 'react';
import { SVGProps } from 'react';
const SvgCopyIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M19.124 4.876a.818.818 0 0 0-.578-.24h-7.364a.818.818 0 0 0-.818.819v.818a.818.818 0 1 1-1.637 0v-.818A2.455 2.455 0 0 1 11.182 3h7.364A2.455 2.455 0 0 1 21 5.455v7.363a2.454 2.454 0 0 1-2.454 2.455h-.819a.818.818 0 1 1 0-1.637h.819a.818.818 0 0 0 .818-.818V5.455a.818.818 0 0 0-.24-.579Zm-5.488 6.306a.818.818 0 0 0-.818-.818H5.455a.818.818 0 0 0-.819.818v7.364c0 .451.367.818.819.818h7.363a.818.818 0 0 0 .818-.819v-7.363Zm-.818-2.455a2.455 2.455 0 0 1 2.455 2.455v7.364A2.454 2.454 0 0 1 12.818 21H5.455A2.455 2.455 0 0 1 3 18.546v-7.364a2.455 2.455 0 0 1 2.455-2.455h7.363Z"
      fill="currentColor"
    />
  </svg>
);
export default SvgCopyIcon;

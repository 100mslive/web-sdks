import * as React from 'react';
import { SVGProps } from 'react';
const SvgHomeIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12.684 3.172a.818.818 0 0 0-1.004 0L4.316 8.9A.818.818 0 0 0 4 9.545v9A2.455 2.455 0 0 0 6.455 21h11.454a2.454 2.454 0 0 0 2.455-2.454v-9a.818.818 0 0 0-.316-.646l-7.364-5.728Zm2.77 16.192h2.455a.818.818 0 0 0 .818-.819v-8.6l-6.545-5.09-6.546 5.09v8.6a.818.818 0 0 0 .819.819h2.454V12c0-.452.366-.818.818-.818h4.91c.451 0 .817.366.817.818v7.364Zm-4.909 0h3.273v-6.546h-3.273v6.546Z"
      fill="currentColor"
    />
  </svg>
);
export default SvgHomeIcon;

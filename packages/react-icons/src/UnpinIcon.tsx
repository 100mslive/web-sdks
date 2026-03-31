import type { SVGProps } from 'react';
import * as React from 'react';
const SvgUnpinIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="none" viewBox="0 0 17 17" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M1.333 1.333 15.5 15.5M8.417 11.958V15.5M6.292 6.292v1.246a1.42 1.42 0 0 1-.787 1.268l-1.26.638a1.42 1.42 0 0 0-.787 1.267v1.247h8.5M10.542 6.532V4.167h.708a1.416 1.416 0 1 0 0-2.834H5.505"
    />
  </svg>
);
export default SvgUnpinIcon;

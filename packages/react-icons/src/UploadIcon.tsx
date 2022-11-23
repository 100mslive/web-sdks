import * as React from 'react';
import { SVGProps } from 'react';
const SvgUploadIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M10.417 17.916v-7.5M7.083 13.75l3.334-3.334 3.333 3.333"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13.75 17.73a7.5 7.5 0 1 0-9.128-8.064 4.167 4.167 0 0 0 .795 8.25h1.666"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default SvgUploadIcon;

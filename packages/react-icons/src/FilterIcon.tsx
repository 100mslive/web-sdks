import * as React from 'react';
import { SVGProps } from 'react';
const SvgFilterIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5 7a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1Zm3 5a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2H9a1 1 0 0 1-1-1Zm3 4a1 1 0 1 0 0 2h2a1 1 0 1 0 0-2h-2Z"
      fill="currentColor"
    />
  </svg>
);
export default SvgFilterIcon;

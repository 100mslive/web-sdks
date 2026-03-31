import type { SVGProps } from 'react';
import * as React from 'react';
const SvgTargetIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M12 5.25a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5M3.75 12a8.25 8.25 0 1 1 16.5 0 8.25 8.25 0 0 1-16.5 0M12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5M6.75 12a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0m4.5 0a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0M12 9.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5"
      clipRule="evenodd"
    />
  </svg>
);
export default SvgTargetIcon;

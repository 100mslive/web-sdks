import type { SVGProps } from 'react';
import * as React from 'react';
const SvgMoneyIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M12.4 3v18m4.5-15.3h-6.75a3.15 3.15 0 1 0 0 6.3h4.5a3.15 3.15 0 0 1 0 6.3H7"
    />
  </svg>
);
export default SvgMoneyIcon;

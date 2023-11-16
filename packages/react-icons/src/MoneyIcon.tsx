import * as React from 'react';
import { SVGProps } from 'react';
const SvgMoneyIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M12.4 3v18m4.5-15.3h-6.75a3.15 3.15 0 1 0 0 6.3h4.5a3.15 3.15 0 0 1 0 6.3H7"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default SvgMoneyIcon;

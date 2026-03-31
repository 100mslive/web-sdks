import type { SVGProps } from 'react';
import * as React from 'react';
const SvgStatsIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="none" viewBox="0 0 32 32" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2.5}
      d="M23.334 25.333V13.667M16.334 25.333V6.667M9.334 25.334v-7"
    />
  </svg>
);
export default SvgStatsIcon;

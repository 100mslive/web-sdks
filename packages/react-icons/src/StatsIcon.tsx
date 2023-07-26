import * as React from 'react';
import { SVGProps } from 'react';
const SvgStatsIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24px" height="24px" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M23.334 25.333V13.667M16.334 25.333V6.667M9.334 25.334v-7"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default SvgStatsIcon;

import type { SVGProps } from 'react';
import * as React from 'react';
const SvgColoredTimeIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="none" viewBox="0 0 48 48" {...props}>
    <path fill="#F5BC00" d="m38.211 14.289-2.5-2.5L38.5 9l2.5 2.5zM27 4h-6v6h6z" />
    <path
      fill="url(#ColoredTimeIcon_svg__a)"
      d="M42.993 25.993c0 10.489-8.504 18.993-18.993 18.993S5.007 36.482 5.007 25.993 13.511 7 24 7s18.993 8.504 18.993 18.993"
    />
    <path fill="#D8E7FF" d="M27 7.236a19.1 19.1 0 0 0-6 0V11h6zM31.535 14.636l-9.899 9.9 2.829 2.828 9.899-9.9z" />
    <path fill="#F5BC00" d="M30 5H18V1h12z" />
    <path fill="#D8E7FF" d="M27.993 24.993a3.993 3.993 0 1 1-7.987 0 3.993 3.993 0 0 1 7.987 0" />
    <defs>
      <linearGradient
        id="ColoredTimeIcon_svg__a"
        x1={6.505}
        x2={28.858}
        y1={7.835}
        y2={49.079}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#2AA4F4" />
        <stop offset={1} stopColor="#007AD9" />
      </linearGradient>
    </defs>
  </svg>
);
export default SvgColoredTimeIcon;

import * as React from 'react';
import { SVGProps } from 'react';
const SvgColoredTimeIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24px" height="24px" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="m38.211 14.289-2.5-2.5L38.5 9l2.5 2.5-2.789 2.789ZM27 4h-6v6h6V4Z" fill="#F5BC00" />
    <path
      d="M42.993 25.993c0 10.489-8.504 18.993-18.993 18.993-10.489 0-18.993-8.504-18.993-18.993C5.007 15.504 13.511 7 24 7c10.489 0 18.993 8.504 18.993 18.993Z"
      fill="url(#ColoredTimeIcon_svg__a)"
    />
    <path
      d="M27 7.236a19.137 19.137 0 0 0-6 0V11h6V7.236ZM31.535 14.636l-9.899 9.9 2.829 2.828 9.899-9.9-2.829-2.828Z"
      fill="#D8E7FF"
    />
    <path d="M30 5H18V1h12v4Z" fill="#F5BC00" />
    <path d="M27.993 24.993a3.993 3.993 0 1 1-7.987 0 3.993 3.993 0 0 1 7.987 0Z" fill="#D8E7FF" />
    <defs>
      <linearGradient
        id="ColoredTimeIcon_svg__a"
        x1={6.505}
        y1={7.835}
        x2={28.858}
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

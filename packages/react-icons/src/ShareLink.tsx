import * as React from 'react';
import { SVGProps } from 'react';

const SvgShareLink = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24px" height="24px" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="m6.031 11.359 6.147 3.582m-.009-9.882L6.031 8.641M17.2 3.7a2.7 2.7 0 1 1-5.4 0 2.7 2.7 0 0 1 5.4 0ZM6.4 10A2.7 2.7 0 1 1 1 10a2.7 2.7 0 0 1 5.4 0Zm10.8 6.3a2.7 2.7 0 1 1-5.4 0 2.7 2.7 0 0 1 5.4 0Z"
      stroke="#F5F9FF"
      strokeOpacity={0.95}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default SvgShareLink;

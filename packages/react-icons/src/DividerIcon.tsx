import type { SVGProps } from 'react';
import * as React from 'react';
const SvgDividerIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="none" viewBox="0 0 24 30" {...props}>
    <path stroke="#777" strokeOpacity={0.5} d="M12 0v30" />
  </svg>
);
export default SvgDividerIcon;

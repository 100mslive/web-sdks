import * as React from 'react';
import { SVGProps } from 'react';
const SvgSidebarIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M9.143 4H4.857C4.384 4 4 4.398 4 4.889V19.11c0 .491.384.889.857.889h4.286c.473 0 .857-.398.857-.889V4.89C10 4.398 9.616 4 9.143 4ZM19.143 4h-4.286a.857.857 0 0 0-.857.857v4.286c0 .473.384.857.857.857h4.286A.857.857 0 0 0 20 9.143V4.857A.857.857 0 0 0 19.143 4ZM19.143 14h-4.286a.857.857 0 0 0-.857.857v4.286c0 .473.384.857.857.857h4.286a.857.857 0 0 0 .857-.857v-4.286a.857.857 0 0 0-.857-.857Z"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default SvgSidebarIcon;

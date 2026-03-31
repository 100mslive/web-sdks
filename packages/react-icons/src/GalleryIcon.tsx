import type { SVGProps } from 'react';
import * as React from 'react';
const SvgGalleryIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M20 9.143V4.857c0-.473-.398-.857-.889-.857H4.89C4.398 4 4 4.384 4 4.857v4.286c0 .473.398.857.889.857H19.11c.491 0 .889-.384.889-.857M20 19.143v-4.286a.857.857 0 0 0-.857-.857h-4.286a.857.857 0 0 0-.857.857v4.286c0 .473.384.857.857.857h4.286a.857.857 0 0 0 .857-.857M10 19.143v-4.286A.857.857 0 0 0 9.143 14H4.857a.857.857 0 0 0-.857.857v4.286c0 .473.384.857.857.857h4.286a.857.857 0 0 0 .857-.857"
    />
  </svg>
);
export default SvgGalleryIcon;

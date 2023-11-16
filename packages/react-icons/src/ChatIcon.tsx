import * as React from 'react';
import { SVGProps } from 'react';
const SvgChatIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.633 5.306a.327.327 0 0 0-.327.327v9.796a.327.327 0 0 0 .327.326h1.959c.36 0 .653.292.653.653v1.633l2.873-2.155a.653.653 0 0 1 .392-.13h6.857a.327.327 0 0 0 .327-.327V5.633a.326.326 0 0 0-.327-.327H5.633Zm-1.155-.828A1.633 1.633 0 0 1 5.633 4h12.734A1.633 1.633 0 0 1 20 5.633v9.796a1.632 1.632 0 0 1-1.633 1.632h-6.64L7.985 19.87a.653.653 0 0 1-1.045-.522V17.06H5.633A1.633 1.633 0 0 1 4 15.43V5.633c0-.433.172-.849.478-1.155Z"
      fill="currentColor"
    />
  </svg>
);
export default SvgChatIcon;

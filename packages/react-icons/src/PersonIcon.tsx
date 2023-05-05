import * as React from 'react';
import { SVGProps } from 'react';

const SvgPersonIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2.813a4.687 4.687 0 1 0 0 9.374 4.687 4.687 0 0 0 0-9.374ZM9.746 5.245a3.188 3.188 0 1 1 4.508 4.508 3.188 3.188 0 0 1-4.508-4.508ZM8.012 16.45a5.64 5.64 0 0 1 9.628 3.988.75.75 0 0 0 1.5 0 7.14 7.14 0 0 0-14.28 0 .75.75 0 0 0 1.5 0 5.64 5.64 0 0 1 1.652-3.988Z"
      fill="currentColor"
    />
  </svg>
);

export default SvgPersonIcon;

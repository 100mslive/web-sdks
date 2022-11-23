import * as React from 'react';
import { SVGProps } from 'react';
const SvgActivityIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9.545 4c.353 0 .665.225.777.56l4.133 12.398 1.678-5.035a.818.818 0 0 1 .776-.56h3.273a.818.818 0 1 1 0 1.637h-2.683l-2.268 6.804a.818.818 0 0 1-1.553 0L9.545 7.406 7.867 12.44a.818.818 0 0 1-.776.559H3.818a.818.818 0 1 1 0-1.636h2.683L8.77 4.559A.818.818 0 0 1 9.545 4Z"
      fill="currentColor"
    />
  </svg>
);
export default SvgActivityIcon;

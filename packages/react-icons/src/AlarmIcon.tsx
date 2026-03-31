import type { SVGProps } from 'react';
import * as React from 'react';
const SvgAlarmIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M18.306 4.24a.818.818 0 0 0-1.157 1.157l2.454 2.454a.818.818 0 0 0 1.157-1.157zm-11.455 0c.32.32.32.837 0 1.157L4.397 7.85A.818.818 0 1 1 3.24 6.694L5.694 4.24a.82.82 0 0 1 1.157 0M6.273 13a5.727 5.727 0 1 1 11.454 0 5.727 5.727 0 0 1-11.454 0M12 5.636a7.364 7.364 0 0 0-5.753 11.96l-1.371 1.37a.818.818 0 0 0 1.157 1.158l1.37-1.37A7.33 7.33 0 0 0 12 20.363a7.33 7.33 0 0 0 4.596-1.61l1.37 1.37a.818.818 0 1 0 1.158-1.157l-1.37-1.37A7.364 7.364 0 0 0 12 5.636m.818 4.091a.818.818 0 1 0-1.636 0V13c0 .217.086.425.24.579l1.636 1.636a.818.818 0 0 0 1.157-1.157l-1.397-1.397z"
      clipRule="evenodd"
    />
  </svg>
);
export default SvgAlarmIcon;

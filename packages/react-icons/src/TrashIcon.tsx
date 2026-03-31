import type { SVGProps } from 'react';
import * as React from 'react';
const SvgTrashIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M9.967 4.876a.82.82 0 0 1 .578-.24h3.273a.82.82 0 0 1 .818.819v.818H9.727v-.818c0-.217.086-.426.24-.579M8.09 6.273v-.818A2.455 2.455 0 0 1 10.545 3h3.273a2.454 2.454 0 0 1 2.455 2.455v.818h3.273a.818.818 0 0 1 0 1.636h-.819v10.637A2.454 2.454 0 0 1 16.273 21H8.09a2.455 2.455 0 0 1-2.455-2.454V7.909h-.818a.818.818 0 1 1 0-1.636zm-.818 12.273V7.909h9.818v10.637a.82.82 0 0 1-.818.818H8.09a.82.82 0 0 1-.818-.819m3.273-8.182c.451 0 .818.366.818.818v4.909a.818.818 0 0 1-1.637 0v-4.91c0-.451.367-.817.819-.817m4.09.818a.818.818 0 0 0-1.636 0v4.909a.818.818 0 1 0 1.636 0z"
      clipRule="evenodd"
    />
  </svg>
);
export default SvgTrashIcon;

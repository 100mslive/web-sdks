import type { SVGProps } from 'react';
import * as React from 'react';
const SvgFileIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M5.719 3.719A2.46 2.46 0 0 1 7.455 3h6.955c.216 0 .424.086.578.24l4.5 4.5c.153.153.24.361.24.578v10.228A2.455 2.455 0 0 1 17.272 21H7.455A2.455 2.455 0 0 1 5 18.546V5.455c0-.651.259-1.276.719-1.736m1.736.917h5.727v4.091c0 .452.366.818.818.818h4.09v9a.82.82 0 0 1-.817.819H7.455a.82.82 0 0 1-.819-.819V5.456a.82.82 0 0 1 .819-.819m7.363 3.273h2.525l-2.525-2.525zM9.091 12a.818.818 0 1 0 0 1.636h6.545a.818.818 0 1 0 0-1.636zm-.818 4.09c0-.451.366-.817.818-.817h6.545a.818.818 0 1 1 0 1.636H9.091a.82.82 0 0 1-.818-.818m.818-7.363a.818.818 0 1 0 0 1.637h1.636a.818.818 0 0 0 0-1.637z"
      clipRule="evenodd"
    />
  </svg>
);
export default SvgFileIcon;

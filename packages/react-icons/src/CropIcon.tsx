import type { SVGProps } from 'react';
import * as React from 'react';
const SvgCropIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M8.347 3.757a.75.75 0 1 0-1.5-.014l-.026 3.078-3.077.027a.75.75 0 0 0 .012 1.5l3.052-.027-.058 6.672V15A2.25 2.25 0 0 0 9 17.25h6.75v3a.75.75 0 0 0 1.5 0v-3h3a.75.75 0 0 0 0-1.5h-3V9A2.25 2.25 0 0 0 15 6.75l-6.679.058zm-.039 4.551-.058 6.695a.75.75 0 0 0 .75.747h6.75V9a.75.75 0 0 0-.747-.75z"
      clipRule="evenodd"
    />
  </svg>
);
export default SvgCropIcon;

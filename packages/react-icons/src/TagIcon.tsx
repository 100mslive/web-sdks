import type { SVGProps } from 'react';
import * as React from 'react';
const SvgTagIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M3.803 4A.803.803 0 0 0 3 4.803v8.032c0 .213.085.417.236.568l6.898 6.89a2.41 2.41 0 0 0 3.41 0l5.758-5.758-.568-.568.57.566a2.41 2.41 0 0 0 0-3.397l-6.901-6.9A.8.8 0 0 0 11.835 4zm14.362 9.4-5.758 5.758a.8.8 0 0 1-1.136 0h-.001l-6.664-6.656V5.606h6.896l6.662 6.663a.803.803 0 0 1 0 1.131M7.819 8.016a.803.803 0 1 0 0 1.606h.008a.803.803 0 1 0 0-1.606z"
      clipRule="evenodd"
    />
  </svg>
);
export default SvgTagIcon;

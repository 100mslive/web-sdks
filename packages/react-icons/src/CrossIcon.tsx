import type { SVGProps } from 'react';
import * as React from 'react';
const SvgCrossIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M5.193 17.383c-.369.37-.386 1.029.01 1.415.386.387 1.045.378 1.414.01l5.38-5.389 5.387 5.388a1.016 1.016 0 0 0 1.415-.009c.378-.395.387-1.037 0-1.415l-5.379-5.387 5.379-5.38a1.01 1.01 0 0 0 0-1.414c-.396-.378-1.037-.387-1.415-.01l-5.388 5.389-5.379-5.388c-.369-.37-1.037-.387-1.415.009-.386.386-.378 1.046-.009 1.415l5.388 5.379z"
    />
  </svg>
);
export default SvgCrossIcon;

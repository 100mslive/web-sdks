import * as React from 'react';
import { SVGProps } from 'react';
const SvgClipIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M14.765 4.592a2.39 2.39 0 0 0-1.69.7l-7.316 7.316a3.983 3.983 0 1 0 5.633 5.633l7.316-7.316a.796.796 0 1 1 1.126 1.126l-7.316 7.316a5.575 5.575 0 1 1-7.885-7.885l7.316-7.316a3.982 3.982 0 0 1 5.632 5.632l-7.324 7.316a2.389 2.389 0 1 1-3.38-3.379l6.76-6.75a.796.796 0 0 1 1.125 1.126l-6.758 6.75a.798.798 0 0 0 1.127 1.127l7.324-7.316a2.391 2.391 0 0 0-1.69-4.08Z"
      fill="currentColor"
    />
  </svg>
);
export default SvgClipIcon;

import * as React from 'react';

function SvgClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.636 12a7.364 7.364 0 1114.728 0 7.364 7.364 0 01-14.728 0zM12 3a9 9 0 100 18 9 9 0 000-18zm.818 4.09a.818.818 0 10-1.636 0V12c0 .153.043.304.124.434l2.046 3.272a.818.818 0 001.387-.867l-1.92-3.074V7.091z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgClockIcon;

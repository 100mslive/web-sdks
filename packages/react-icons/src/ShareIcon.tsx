import * as React from 'react';

function SvgShareIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M18.867 7.2H13a2.133 2.133 0 00-2.133 2.133V12"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.667 10.4l3.2-3.2-3.2-3.2M16.733 13.6v5.333A1.067 1.067 0 0115.667 20h-9.6A1.067 1.067 0 015 18.933V10.4a1.067 1.067 0 011.067-1.067h1.6"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default SvgShareIcon;

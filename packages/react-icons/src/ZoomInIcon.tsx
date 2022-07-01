import * as React from 'react';

function SvgZoomInIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.6 11.2a5.6 5.6 0 119.633 3.885.795.795 0 00-.148.148A5.6 5.6 0 015.6 11.2zm10.094 5.626a7.2 7.2 0 111.131-1.131l2.94 2.94a.8.8 0 01-1.13 1.13l-2.94-2.94zM11.2 8a.8.8 0 01.8.8v1.6h1.6a.8.8 0 010 1.6H12v1.6a.8.8 0 01-1.6 0V12H8.8a.8.8 0 110-1.6h1.6V8.8a.8.8 0 01.8-.8z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgZoomInIcon;

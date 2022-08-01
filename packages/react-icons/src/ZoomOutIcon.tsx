import * as React from 'react';

function SvgZoomOutIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.2 5.6a5.6 5.6 0 103.885 9.633.808.808 0 01.148-.148A5.6 5.6 0 0011.2 5.6zm0 12.8c1.7 0 3.262-.59 4.494-1.574l2.94 2.94a.8.8 0 001.132-1.132l-2.94-2.94A7.2 7.2 0 1011.2 18.4zm-2.4-8a.8.8 0 000 1.6h4.8a.8.8 0 100-1.6H8.8z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgZoomOutIcon;

import * as React from 'react';

function SvgLinkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.595 9.595a3.273 3.273 0 012.314-.959h1.636a.818.818 0 000-1.636H7.91a4.91 4.91 0 000 9.818h1.636a.818.818 0 000-1.636H7.91a3.273 3.273 0 01-2.314-5.587zM14.455 7a.818.818 0 000 1.636h1.636a3.273 3.273 0 010 6.546h-1.637a.818.818 0 000 1.636h1.637a4.909 4.909 0 100-9.818h-1.637zm-5.728 4.09a.818.818 0 000 1.637h6.546a.818.818 0 100-1.636H8.727z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgLinkIcon;

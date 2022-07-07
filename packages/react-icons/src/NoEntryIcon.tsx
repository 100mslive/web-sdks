import * as React from 'react';

function SvgNoEntryIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.636 12a7.364 7.364 0 1114.728 0 7.364 7.364 0 01-14.728 0zM12 3a9 9 0 100 18 9 9 0 000-18zm-3.273 8.182a.818.818 0 100 1.636h6.546a.818.818 0 100-1.636H8.727z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgNoEntryIcon;

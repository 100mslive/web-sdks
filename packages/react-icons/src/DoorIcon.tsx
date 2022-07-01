import * as React from 'react';

function SvgDoorIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.125 2.813a1.5 1.5 0 00-1.5 1.5v15.375h-1.5a.75.75 0 000 1.5h15.75a.75.75 0 000-1.5h-1.5V4.313a1.5 1.5 0 00-1.5-1.5h-9.75zm9.75 16.875V4.313h-9.75v15.375h9.75zm-1.333-6.959a1.031 1.031 0 10-1.459-1.458 1.031 1.031 0 001.459 1.458z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgDoorIcon;

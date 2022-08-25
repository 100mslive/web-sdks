import * as React from 'react';

function SvgJoinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.8 3.9a.9.9 0 01.9-.9h3.6A2.7 2.7 0 0121 5.7v12.6a2.7 2.7 0 01-2.7 2.7h-3.6a.9.9 0 110-1.8h3.6a.9.9 0 00.9-.9V5.7a.9.9 0 00-.9-.9h-3.6a.9.9 0 01-.9-.9zM9.564 6.864a.9.9 0 011.272 0l4.498 4.498a.897.897 0 010 1.277l-4.498 4.497a.9.9 0 11-1.272-1.272l2.963-2.964H3.9a.9.9 0 010-1.8h8.627L9.564 8.136a.9.9 0 010-1.272z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgJoinIcon;

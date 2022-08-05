import * as React from 'react';

function SvgTargetIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 5.25a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM3.75 12a8.25 8.25 0 1116.5 0 8.25 8.25 0 01-16.5 0zM12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5zM6.75 12a5.25 5.25 0 1110.5 0 5.25 5.25 0 01-10.5 0zm4.5 0a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM12 9.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgTargetIcon;

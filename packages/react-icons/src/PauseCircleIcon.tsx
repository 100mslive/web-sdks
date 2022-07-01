import * as React from 'react';

function SvgPauseCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 4.636a7.364 7.364 0 100 14.728 7.364 7.364 0 000-14.728zM3 12a9 9 0 1118 0 9 9 0 01-18 0zm7.364-3.273c.451 0 .818.367.818.818v4.91a.818.818 0 01-1.637 0v-4.91c0-.451.367-.818.819-.818zm4.09.818a.818.818 0 00-1.636 0v4.91a.818.818 0 001.637 0v-4.91z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgPauseCircleIcon;

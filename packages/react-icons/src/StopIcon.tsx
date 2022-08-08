import * as React from 'react';

function SvgStopIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.545 8.727a.818.818 0 00-.818.818v4.91c0 .451.367.818.818.818h4.91a.818.818 0 00.818-.818v-4.91a.818.818 0 00-.818-.818h-4.91zm.819 4.91v-3.273h3.272v3.272h-3.272z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 3a9 9 0 100 18 9 9 0 000-18zm-7.364 9a7.364 7.364 0 1114.728 0 7.364 7.364 0 01-14.728 0z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgStopIcon;

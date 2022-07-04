import * as React from 'react';

function SvgAddCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 4.636a7.364 7.364 0 100 14.728 7.364 7.364 0 000-14.728zM3 12a9 9 0 1118 0 9 9 0 01-18 0zm9-4.09c.452 0 .818.365.818.817v2.455h2.455a.818.818 0 110 1.636h-2.455v2.455a.818.818 0 11-1.636 0v-2.455H8.727a.818.818 0 110-1.636h2.455V8.727c0-.452.366-.818.818-.818z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgAddCircleIcon;

import * as React from 'react';

function SvgWrenchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15.476 4.741a4.285 4.285 0 00-4.384 6.024.857.857 0 01-.175.96l-5.922 5.92a.96.96 0 101.36 1.36l5.92-5.922a.857.857 0 01.96-.175 4.284 4.284 0 006.024-4.384l-2.204 2.204a1.714 1.714 0 01-2.4 0l-.006-.006-1.377-1.377a1.714 1.714 0 010-2.4l.006-.006 2.198-2.198zM13.92 3.097a5.998 5.998 0 013.548.437.857.857 0 01.253 1.386l-3.225 3.225 1.36 1.359 3.224-3.225a.857.857 0 011.387.253 5.999 5.999 0 01-7.375 8.16l-5.526 5.525a2.675 2.675 0 01-3.783-3.783l5.526-5.526a5.999 5.999 0 014.61-7.81z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgWrenchIcon;

import * as React from 'react';

function SvgBranchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 4.8a.8.8 0 00-1.6 0v8.902a3.2 3.2 0 101.637.01 6.4 6.4 0 015.674-5.675 3.2 3.2 0 10-.017-1.606A8 8 0 008 9.6V4.8zm-.8 10.4a1.6 1.6 0 100 3.2 1.6 1.6 0 000-3.2zm9.6-1.6a.8.8 0 01.8.8V16h1.6a.8.8 0 010 1.6h-1.6v1.6a.8.8 0 01-1.6 0v-1.6h-1.6a.8.8 0 010-1.6H16v-1.6a.8.8 0 01.8-.8z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgBranchIcon;

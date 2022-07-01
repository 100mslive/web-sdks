import * as React from 'react';

function SvgCartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.833 2a.833.833 0 000 1.667h2.65l.694 3.462a.827.827 0 00.014.07l1.392 6.956a2.5 2.5 0 002.49 2.012h8.087a2.5 2.5 0 002.49-2.013l1.335-6.998a.833.833 0 00-.818-.99H7.684l-.7-3.496A.833.833 0 006.167 2H2.833zm6.384 11.83l-1.2-5.997H20.16l-1.144 5.999a.833.833 0 01-.832.668H10.05a.833.833 0 01-.834-.67zM7.833 19.5a1.667 1.667 0 113.334 0 1.667 1.667 0 01-3.334 0zm9.167 0a1.667 1.667 0 113.333 0 1.667 1.667 0 01-3.333 0z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgCartIcon;

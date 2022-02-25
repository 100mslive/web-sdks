import * as React from 'react';

function SvgHamburgerMenuIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M5 6.5a.75.75 0 01.75-.75h12.5a.75.75 0 010 1.5H5.75A.75.75 0 015 6.5zM5 12a.75.75 0 01.75-.75h12.5a.75.75 0 010 1.5H5.75A.75.75 0 015 12zm.75 4.75a.75.75 0 000 1.5h12.5a.75.75 0 000-1.5H5.75z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgHamburgerMenuIcon;

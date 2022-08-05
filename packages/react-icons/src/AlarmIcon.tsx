import * as React from 'react';

function SvgAlarmIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18.306 4.24a.818.818 0 00-1.157 1.157l2.454 2.454a.818.818 0 001.157-1.157L18.306 4.24zm-11.455 0c.32.32.32.837 0 1.157L4.397 7.85A.818.818 0 113.24 6.694L5.694 4.24a.818.818 0 011.157 0zM6.273 13a5.727 5.727 0 1111.454 0 5.727 5.727 0 01-11.454 0zM12 5.636a7.364 7.364 0 00-5.753 11.96l-1.371 1.37a.818.818 0 001.157 1.158l1.37-1.37A7.333 7.333 0 0012 20.363a7.332 7.332 0 004.596-1.61l1.37 1.37a.818.818 0 101.158-1.157l-1.37-1.37A7.364 7.364 0 0012 5.636zm.818 4.091a.818.818 0 10-1.636 0V13c0 .217.086.425.24.579l1.636 1.636a.818.818 0 001.157-1.157l-1.397-1.397V9.727z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgAlarmIcon;

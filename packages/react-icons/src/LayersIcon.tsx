import * as React from 'react';

function SvgLayersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.634 3.086a.818.818 0 01.732 0l8.182 4.091a.818.818 0 010 1.464l-8.182 4.09a.818.818 0 01-.732 0l-8.181-4.09a.818.818 0 010-1.464l8.181-4.09zM5.648 7.91L12 11.085l6.352-3.176L12 4.733 5.648 7.909zm-2.561 7.816a.818.818 0 011.097-.366L12 19.267l7.816-3.908a.818.818 0 11.732 1.464l-8.182 4.09a.818.818 0 01-.732 0l-8.182-4.09a.818.818 0 01-.365-1.098zm1.097-4.457a.818.818 0 10-.732 1.464l8.182 4.09c.23.116.502.116.732 0l8.182-4.09a.818.818 0 10-.732-1.464L12 15.176l-7.816-3.908z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgLayersIcon;

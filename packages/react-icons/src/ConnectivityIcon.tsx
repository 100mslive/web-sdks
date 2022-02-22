import * as React from 'react';

function SvgConnectivityIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.48 10.478a12.069 12.069 0 0115.116.006.91.91 0 101.142-1.42A13.89 13.89 0 003.34 9.057a.91.91 0 101.14 1.42zM17.4 14a7.969 7.969 0 00-10.76.024.91.91 0 01-1.233-1.341 9.79 9.79 0 0113.22-.03A.91.91 0 0117.4 14zm-5.368.198a5.7 5.7 0 011.753.278 5.7 5.7 0 012.267 1.385.91.91 0 01-1.286 1.29 3.877 3.877 0 00-3.66-1.018 3.878 3.878 0 00-1.808 1.018.91.91 0 01-1.285-1.29 5.7 5.7 0 014.02-1.663z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgConnectivityIcon;

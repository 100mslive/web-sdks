import * as React from 'react';

function SvgFilterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5 7a1 1 0 011-1h12a1 1 0 110 2H6a1 1 0 01-1-1zm3 5a1 1 0 011-1h6a1 1 0 110 2H9a1 1 0 01-1-1zm3 4a1 1 0 100 2h2a1 1 0 100-2h-2z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgFilterIcon;

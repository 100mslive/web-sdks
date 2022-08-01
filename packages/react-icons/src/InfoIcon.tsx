import * as React from 'react';

function SvgInfoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 3.864a6.136 6.136 0 100 12.272 6.136 6.136 0 000-12.272zM2.5 10a7.5 7.5 0 1115 0 7.5 7.5 0 01-15 0zm7.5-.682c.377 0 .682.305.682.682v2.727a.682.682 0 11-1.364 0V10c0-.377.305-.682.682-.682zm0-2.727a.682.682 0 100 1.364h.007a.682.682 0 100-1.364H10z"
        fill="currentColor"
        fillOpacity={0.8}
      />
    </svg>
  );
}

export default SvgInfoIcon;

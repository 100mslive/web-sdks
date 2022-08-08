import * as React from 'react';

function SvgSearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.6 11.2a5.6 5.6 0 119.633 3.885.823.823 0 00-.148.148A5.6 5.6 0 015.6 11.2zm10.094 5.626a7.2 7.2 0 111.131-1.131l2.94 2.94a.8.8 0 01-1.13 1.13l-2.94-2.94z"
        fill="currentColor"
        fillOpacity={0.8}
      />
    </svg>
  );
}

export default SvgSearchIcon;

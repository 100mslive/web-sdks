import * as React from 'react';

function SvgNetworkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21 6a1 1 0 10-2 0v12a1 1 0 102 0V6zm-6 3a1 1 0 011 1v8a1 1 0 11-2 0v-8a1 1 0 011-1zm-4 5a1 1 0 10-2 0v4a1 1 0 102 0v-4zm-6 3a1 1 0 100 2h.01a1 1 0 100-2H5z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgNetworkIcon;

import * as React from 'react';

function SvgLayoutIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.4 5.6a.8.8 0 00-.8.8v2.4h12.8V6.4a.8.8 0 00-.8-.8H6.4zm2.4 4.8H5.6v7.2a.8.8 0 00.8.8h2.4v-8zm1.6 8v-8h8v7.2a.8.8 0 01-.8.8h-7.2zM9.607 20H17.6a2.4 2.4 0 002.4-2.4V6.4A2.4 2.4 0 0017.6 4H6.4A2.4 2.4 0 004 6.4v11.2A2.4 2.4 0 006.4 20H9.607z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgLayoutIcon;

import * as React from 'react';

function SvgWalletIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.4 6.6a.8.8 0 000 1.6h8.8V6.6H6.4zm10.4 1.6V5.8A.8.8 0 0016 5H6.4A2.405 2.405 0 004 7.4V17c0 1.322 1.078 2.4 2.4 2.4h11.2a.8.8 0 00.8-.8v-2.4h.8a.8.8 0 00.8-.8v-3.2a.8.8 0 00-.8-.8h-.8V9a.8.8 0 00-.8-.8h-.8zm.79 4.8h.81v1.6H16a.8.8 0 010-1.6h1.59zm-.79-1.6V9.8H6.4a2.4 2.4 0 01-.8-.137V17c0 .438.362.8.8.8h10.4v-1.6H16a2.4 2.4 0 010-4.8h.8z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgWalletIcon;

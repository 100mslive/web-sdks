import * as React from 'react';

function SvgSaveIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.4 5.6a.8.8 0 00-.8.8v11.2a.8.8 0 00.8.8h.8v-5.6A.8.8 0 018 12h8a.8.8 0 01.8.8v5.6h.8a.8.8 0 00.8-.8V9.131L14.869 5.6H8.8V8h5.6a.8.8 0 010 1.6H8a.8.8 0 01-.8-.8V5.6h-.8zM8 4H6.4A2.4 2.4 0 004 6.4v11.2A2.4 2.4 0 006.4 20h11.2a2.4 2.4 0 002.4-2.4V8.8a.8.8 0 00-.234-.566l-4-4A.8.8 0 0015.2 4H8zm.8 9.6v4.8h6.4v-4.8H8.8z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgSaveIcon;

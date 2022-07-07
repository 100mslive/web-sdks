import * as React from 'react';

function SvgBookmarkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.4 5.6a.8.8 0 00-.8.8v11.421l4.403-2.516a.8.8 0 01.794 0l4.403 2.517V6.4a.8.8 0 00-.8-.8h-8zm-1.697-.897A2.4 2.4 0 018.4 4h8a2.4 2.4 0 012.4 2.4v12.8a.8.8 0 01-1.197.695L12.4 16.92l-5.203 2.974A.8.8 0 016 19.2V6.4a2.4 2.4 0 01.703-1.697z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgBookmarkIcon;

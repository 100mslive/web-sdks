import * as React from 'react';

function SvgBookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.75 5.25a.75.75 0 01.75-.75H9a3.75 3.75 0 013.75 3.75v10.5a.75.75 0 01-1.5 0 1.5 1.5 0 00-1.5-1.5H4.5a.75.75 0 01-.75-.75V5.25zm7.5 10.902V8.25A2.25 2.25 0 009 6H5.25v9.75h4.5a3 3 0 011.5.402z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.348 5.598A3.75 3.75 0 0115 4.5h4.5a.75.75 0 01.75.75V16.5a.75.75 0 01-.75.75h-5.25a1.5 1.5 0 00-1.5 1.5.75.75 0 01-1.5 0V8.25a3.75 3.75 0 011.098-2.652zm.402 10.554a3 3 0 011.5-.402h4.5V6H15a2.25 2.25 0 00-2.25 2.25v7.902z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgBookIcon;

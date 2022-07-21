import * as React from 'react';

function SvgExitIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.733 7.6A1.133 1.133 0 007.6 8.733V24.6a1.133 1.133 0 001.133 1.133h4.534a1.133 1.133 0 110 2.267H8.733a3.4 3.4 0 01-3.4-3.4V8.733a3.4 3.4 0 013.4-3.4h4.534a1.133 1.133 0 110 2.267H8.733zM20.4 10.199a1.133 1.133 0 011.603 0l5.663 5.663.037.039a1.128 1.128 0 01.203 1.222 1.13 1.13 0 01-.24.349l-5.663 5.663a1.133 1.133 0 01-1.603-1.603L24.13 17.8H13.267a1.133 1.133 0 110-2.267H24.13l-3.732-3.732a1.133 1.133 0 010-1.602z"
        fill="currentColor"
        fillOpacity={0.95}
      />
    </svg>
  );
}

export default SvgExitIcon;

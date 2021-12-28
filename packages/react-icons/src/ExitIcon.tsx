import * as React from 'react';

function SvgExitIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.333 3.375a1.827 1.827 0 00-1.772 1.89v13.47a1.828 1.828 0 001.772 1.89h9.205a1.828 1.828 0 001.773-1.89v-3.36a.75.75 0 00-1.5 0v3.409a.328.328 0 01-.297.341H5.357a.328.328 0 01-.297-.341V5.25v-.034a.327.327 0 01.297-.341h9.157a.328.328 0 01.298.341l-.001.034v3.375a.75.75 0 001.5 0v-3.36a1.828 1.828 0 00-1.773-1.89H5.333zm12.51 5.285a.75.75 0 011.06 0l2.813 2.813a.747.747 0 010 1.06l-2.813 2.813a.75.75 0 11-1.06-1.06l1.532-1.533H9.373a.75.75 0 010-1.5h10.002l-1.532-1.532a.75.75 0 010-1.06z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgExitIcon;

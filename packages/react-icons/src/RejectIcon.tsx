import * as React from 'react';

function SvgRejectIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21.088 12.154c0 4.975-4.113 9.088-9.097 9.088-4.974 0-9.088-4.113-9.088-9.088 0-4.974 4.105-9.088 9.08-9.088 4.983 0 9.105 4.114 9.105 9.088zM7.516 17.898a7.23 7.23 0 004.475 1.534 7.253 7.253 0 007.278-7.278 7.265 7.265 0 00-1.537-4.472L7.516 17.898zm-1.39-1.438l10.17-10.17a7.27 7.27 0 00-4.314-1.404 7.234 7.234 0 00-7.25 7.268c0 1.615.516 3.102 1.394 4.306z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgRejectIcon;

import * as React from 'react';

function SvgExternalLinkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15.72.194a.798.798 0 01.277.606v4.8a.8.8 0 11-1.6 0V2.731l-7.432 7.435a.8.8 0 11-1.132-1.132L13.267 1.6h-2.869a.8.8 0 010-1.6h4.8a.797.797 0 01.521.194zM2.4 4a.8.8 0 00-.8.8v8.8a.8.8 0 00.8.8h8.798a.8.8 0 00.8-.8V8.8a.8.8 0 111.6 0v4.8a2.4 2.4 0 01-2.4 2.4H2.4A2.4 2.4 0 010 13.6V4.8a2.4 2.4 0 012.4-2.4h4.799a.8.8 0 010 1.6h-4.8z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgExternalLinkIcon;

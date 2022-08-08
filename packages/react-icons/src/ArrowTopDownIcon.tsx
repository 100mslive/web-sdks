import * as React from 'react';

function SvgArrowTopDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.8 9.6a.8.8 0 10-1.6 0v7.669l-1.834-1.835a.8.8 0 00-1.132 1.132l3.195 3.194a.802.802 0 001.146-.004l3.19-3.19a.8.8 0 00-1.13-1.132L16.8 17.27V9.6zM7.2 14.4a.8.8 0 101.6 0V6.73l1.834 1.835a.8.8 0 001.132-1.132L8.57 4.24A.805.805 0 008 4a.798.798 0 00-.575.244l-3.19 3.19a.8.8 0 001.13 1.132L7.2 6.73V14.4z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgArrowTopDownIcon;

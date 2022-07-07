import * as React from 'react';

function SvgMaximizeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M19.766 4.234A.796.796 0 0120 4.81V9.6a.8.8 0 01-1.6 0V6.731l-4.234 4.235a.8.8 0 01-1.132-1.132L17.27 5.6H14.4a.8.8 0 010-1.6H19.207a.802.802 0 01.559.234zM5.6 14.4a.8.8 0 10-1.6 0v4.8a.797.797 0 00.8.8h4.8a.8.8 0 000-1.6H6.731l4.235-4.234a.8.8 0 00-1.132-1.132L5.6 17.27V14.4z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgMaximizeIcon;

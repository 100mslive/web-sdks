import * as React from 'react';

function SvgPauseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M11.875 4a7.875 7.875 0 100 15.75 7.875 7.875 0 000-15.75zM10.75 14.688a1.125 1.125 0 11-2.25 0V9.061a1.125 1.125 0 012.25 0v5.626zm4.5 0a1.125 1.125 0 11-2.25 0V9.061a1.125 1.125 0 112.25 0v5.626z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgPauseIcon;

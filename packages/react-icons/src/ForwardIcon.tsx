import * as React from 'react';

function SvgForwardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15.295 6.26a.889.889 0 00-1.257 1.257l2.927 2.927h-8.52A4.444 4.444 0 004 14.89v1.778a.889.889 0 001.778 0v-1.778a2.667 2.667 0 012.666-2.667h8.521l-2.927 2.927a.889.889 0 001.257 1.257l4.442-4.441.026-.027a.886.886 0 00-.023-1.233L15.295 6.26z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgForwardIcon;

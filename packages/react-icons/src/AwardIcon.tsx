import * as React from 'react';

function SvgAwardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.5 9a4.5 4.5 0 116.999 3.743.74.74 0 00-.122.079A4.5 4.5 0 017.5 9zm6.74 5.568A5.982 5.982 0 0112 15a5.984 5.984 0 01-2.239-.432l-.563 4.238 2.416-1.45a.75.75 0 01.772 0l2.416 1.45-.563-4.238zm-5.885-.802a6 6 0 117.292 0l.846 6.385a.75.75 0 01-1.129.742L12 18.875l-3.364 2.018a.75.75 0 01-1.13-.742l.849-6.385z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgAwardIcon;

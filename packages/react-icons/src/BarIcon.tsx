import * as React from 'react';

function SvgBarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.593 4A2.593 2.593 0 004 6.593v11.314A2.593 2.593 0 006.593 20.5h11.314a2.593 2.593 0 002.593-2.593V6.593A2.593 2.593 0 0017.907 4H6.593zM5.414 6.593c0-.651.528-1.179 1.179-1.179h11.314c.651 0 1.179.528 1.179 1.179v11.314c0 .651-.528 1.179-1.179 1.179H6.593c-.651 0-1.179-.528-1.179-1.179V6.593zm10.283 1.286a.707.707 0 00-1.237-.687l-4.714 8.486a.707.707 0 101.236.687l4.715-8.486z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgBarIcon;

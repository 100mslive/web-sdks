import * as React from 'react';

function SvgInformationIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 4.636a7.364 7.364 0 100 14.728 7.364 7.364 0 000-14.728zM3 12a9 9 0 1118 0 9 9 0 01-18 0zm9-.818c.452 0 .818.366.818.818v3.273a.818.818 0 01-1.636 0V12c0-.452.366-.818.818-.818zm0-3.273a.818.818 0 100 1.637h.008a.818.818 0 000-1.637H12z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgInformationIcon;

import * as React from 'react';

function SvgComputerIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.294 3.372a.75.75 0 01.75-.75h19.912a.75.75 0 01.75.75v13.274a.75.75 0 01-.75.75h-8.737l.07 2.482h4.02a.75.75 0 010 1.5H6.69a.75.75 0 010-1.5h4.021l.07-2.482H2.044a.75.75 0 01-.75-.75V3.372zm19.912 12.524H2.794V4.122h18.412v11.774z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgComputerIcon;

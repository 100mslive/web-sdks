import * as React from 'react';

function SvgMailIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.724 7.09a.823.823 0 01.73-.454h13.091c.318 0 .596.186.731.454L12 12.183 4.724 7.09zM3 7.438v9.835a2.46 2.46 0 002.455 2.454h13.09A2.46 2.46 0 0021 17.273V7.455M3 7.438A2.46 2.46 0 015.455 5h13.09A2.46 2.46 0 0121 7.442M4.636 9.027l6.895 4.826a.818.818 0 00.938 0l6.895-4.826v8.247c0 .448-.37.818-.819.818H5.456a.823.823 0 01-.819-.818V9.026z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgMailIcon;

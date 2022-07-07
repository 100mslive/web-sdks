import * as React from 'react';

function SvgThumbsUpIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.434 3.486A.818.818 0 0111.182 3a3.273 3.273 0 013.272 3.273v2.454h3.809a2.454 2.454 0 012.45 2.823l-1.13 7.363A2.457 2.457 0 0117.133 21H5.456A2.455 2.455 0 013 18.545v-5.727a2.454 2.454 0 012.455-2.454h1.922l3.057-6.878zm-1.707 7.87l2.952-6.642a1.636 1.636 0 011.14 1.559v3.272c0 .452.365.819.817.819h4.641a.82.82 0 01.818.94l-1.13 7.364a.819.819 0 01-.818.696h-8.42v-8.009zm-1.636 8.007V12H5.455a.818.818 0 00-.819.818v5.727a.818.818 0 00.819.818H7.09z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgThumbsUpIcon;

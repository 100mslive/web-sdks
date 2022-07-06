import * as React from 'react';

function SvgCalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.273 3.818a.818.818 0 10-1.637 0v.818H9.727v-.818a.818.818 0 00-1.636 0v.818H6.455A2.455 2.455 0 004 7.091V18.545A2.455 2.455 0 006.455 21h11.454a2.454 2.454 0 002.455-2.455V7.091a2.455 2.455 0 00-2.455-2.455h-1.636v-.818zm2.454 5.727V7.091a.818.818 0 00-.818-.818h-1.636v.818a.818.818 0 11-1.637 0v-.818H9.727v.818a.818.818 0 01-1.636 0v-.818H6.455a.818.818 0 00-.819.818v2.454h13.091zm-13.09 1.637h13.09v7.363a.818.818 0 01-.818.819H6.455a.818.818 0 01-.819-.819v-7.363z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgCalendarIcon;

import * as React from 'react';

function SvgBatteryFullIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.455 8.636a.818.818 0 00-.819.819v4.909c0 .451.367.818.819.818h9.818a.818.818 0 00.818-.818v-4.91a.818.818 0 00-.818-.818H5.455zM3 9.455A2.455 2.455 0 015.455 7h9.818a2.455 2.455 0 012.454 2.455v4.909a2.455 2.455 0 01-2.454 2.454H5.455A2.455 2.455 0 013 14.364v-4.91zm17.182.818c.452 0 .818.366.818.818v1.636a.818.818 0 01-1.636 0v-1.636c0-.452.366-.818.818-.818zm-12.273 0a.818.818 0 10-1.636 0v3.273a.818.818 0 101.636 0v-3.273zm2.455-.818c.451 0 .818.366.818.818v3.273a.818.818 0 11-1.637 0v-3.273c0-.452.367-.818.819-.818zm4.09.818a.818.818 0 00-1.636 0v3.273a.818.818 0 101.637 0v-3.273z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgBatteryFullIcon;

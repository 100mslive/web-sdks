import * as React from 'react';

function SvgBatteryPowerIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.603 7.117a.818.818 0 01.28 1.122l-1.71 2.852H12a.818.818 0 01.702 1.24l-2.455 4.09a.818.818 0 01-1.403-.842l1.71-2.852H8.728a.818.818 0 01-.701-1.239l2.454-4.09a.818.818 0 011.123-.281zM13.636 7a.818.818 0 100 1.636h1.637a.818.818 0 01.818.819v4.909a.818.818 0 01-.818.818h-2.455a.818.818 0 100 1.636h2.455a2.455 2.455 0 002.454-2.454v-4.91A2.455 2.455 0 0015.273 7h-1.637zM5.455 7A2.455 2.455 0 003 9.455v4.909a2.455 2.455 0 002.455 2.454H7.09a.818.818 0 100-1.636H5.455a.818.818 0 01-.819-.818v-4.91a.818.818 0 01.819-.818h2.454A.818.818 0 007.91 7H5.455zM21 11.091a.818.818 0 10-1.636 0v1.636a.818.818 0 001.636 0v-1.636z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgBatteryPowerIcon;

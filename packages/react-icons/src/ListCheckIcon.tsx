import * as React from 'react';

function SvgListCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.752 3.48c.307-.308.723-.48 1.157-.48h4.91a1.636 1.636 0 011.635 1.636h.819a2.455 2.455 0 012.454 2.455v11.454A2.454 2.454 0 0117.273 21H7.455A2.455 2.455 0 015 18.546V7.09a2.455 2.455 0 012.455-2.455h.818c0-.434.172-.85.479-1.157zm7.223 3.95c.307-.307.48-.723.48-1.157h.818a.818.818 0 01.818.818v11.454a.818.818 0 01-.818.819H7.455a.818.818 0 01-.819-.819V7.091a.818.818 0 01.819-.818h.818a1.636 1.636 0 001.636 1.636h4.91c.433 0 .85-.172 1.156-.48zM9.91 6.273V4.636h4.91v1.637h-4.91zm5.488 5.487a.818.818 0 10-1.157-1.157l-2.695 2.694-1.057-1.057a.818.818 0 00-1.157 1.157l1.636 1.636c.32.32.838.32 1.157 0l3.273-3.273z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgListCheckIcon;

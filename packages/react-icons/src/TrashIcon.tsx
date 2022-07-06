import * as React from 'react';

function SvgTrashIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.967 4.876a.818.818 0 01.578-.24h3.273a.818.818 0 01.818.819v.818H9.727v-.818c0-.217.086-.426.24-.579zM8.09 6.273v-.818A2.455 2.455 0 0110.545 3h3.273a2.454 2.454 0 012.455 2.455v.818h3.273a.818.818 0 010 1.636h-.819v10.637A2.454 2.454 0 0116.273 21H8.09a2.455 2.455 0 01-2.455-2.454V7.909h-.818a.818.818 0 110-1.636h3.273zm-.818 12.273V7.909h9.818v10.637a.818.818 0 01-.818.818H8.09a.818.818 0 01-.818-.819zm3.273-8.182c.451 0 .818.366.818.818v4.909a.818.818 0 01-1.637 0v-4.91c0-.451.367-.817.819-.817zm4.09.818a.818.818 0 00-1.636 0v4.909a.818.818 0 101.636 0v-4.91z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgTrashIcon;

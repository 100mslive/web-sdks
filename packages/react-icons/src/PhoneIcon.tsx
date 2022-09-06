import * as React from 'react';
import { SVGProps } from 'react';

const SvgPhoneIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24px" height="24px" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M1.636 2.455c0-.452.367-.819.819-.819h8.181c.452 0 .819.367.819.819v13.09a.818.818 0 0 1-.819.819H2.455a.818.818 0 0 1-.819-.819V2.456ZM2.455 0A2.455 2.455 0 0 0 0 2.455v13.09A2.455 2.455 0 0 0 2.455 18h8.181a2.454 2.454 0 0 0 2.455-2.454V2.455A2.455 2.455 0 0 0 10.636 0H2.455Zm4.09 13.09a.818.818 0 1 0 0 1.637h.009a.818.818 0 1 0 0-1.636h-.009Z"
      fill="currentColor"
    />
  </svg>
);

export default SvgPhoneIcon;

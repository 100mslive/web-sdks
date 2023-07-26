import * as React from 'react';
import { SVGProps } from 'react';
const SvgBillIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M5.402 7.2V5.6c0-.424.165-.831.46-1.131.296-.3.697-.469 1.114-.469h6.693L18 8.4v10c0 .424-.166.831-.461 1.131-.296.3-.696.469-1.114.469H5.402m7.874-16v4.8H18m-12.598.64v8.133m2-6.913H4.402c-.372 0-.728.15-.99.417a1.435 1.435 0 0 0 0 2.013c.262.267.618.417.99.417h2.001c.372 0 .728.15.99.417a1.435 1.435 0 0 1 0 2.012 1.39 1.39 0 0 1-.99.417H3"
      stroke="currentColor"
      strokeOpacity={0.95}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default SvgBillIcon;

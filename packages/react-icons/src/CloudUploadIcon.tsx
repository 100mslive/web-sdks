import * as React from 'react';
import { SVGProps } from 'react';
const SvgCloudUploadIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24px" height="24px" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M48 27c0 6.63-5.37 12-12 12H9.5C4.25 39 0 34.75 0 29.5c0-4.54 3.18-8.34 7.45-9.28C9.15 13.21 15.46 8 23 8c5.51 0 10.36 2.78 13.24 7.01C42.76 15.13 48 20.45 48 27Z"
      fill="url(#CloudUploadIcon_svg__a)"
    />
    <path
      opacity={0.05}
      d="M21 24.441v7a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-7h2.648c1.336 0 2.006-1.616 1.061-2.561l-5.295-5.295a2 2 0 0 0-2.828 0l-5.295 5.295c-.945.945-.276 2.561 1.061 2.561H21Z"
      fill="#000"
    />
    <path
      opacity={0.07}
      d="M21.5 23.941v7.5a1.5 1.5 0 0 0 1.5 1.5h2a1.5 1.5 0 0 0 1.5-1.5v-7.5h3.021c.938 0 1.408-1.134.745-1.798l-5.129-5.13a1.606 1.606 0 0 0-2.27 0l-5.13 5.13c-.663.663-.194 1.798.745 1.798H21.5Z"
      fill="#000"
    />
    <path
      d="M18.607 23.44H22v8a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-8h3.393c.54 0 .81-.652.428-1.033l-4.964-4.964a1.213 1.213 0 0 0-1.714 0l-4.964 4.964a.605.605 0 0 0 .428 1.034Z"
      fill="currentColor"
    />
    <defs>
      <linearGradient
        id="CloudUploadIcon_svg__a"
        x1={14.242}
        y1={9.358}
        x2={30.172}
        y2={39.695}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#2F80FF" />
        <stop offset={1} stopColor="#468EFF" />
      </linearGradient>
    </defs>
  </svg>
);
export default SvgCloudUploadIcon;

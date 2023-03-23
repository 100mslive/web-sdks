import * as React from 'react';
import { SVGProps } from 'react';

const SvgHandIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    style={{
      fillRule: 'evenodd',
      clipRule: 'evenodd',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }}
    width="24px"
    height="24px"
    {...props}
  >
    <path
      d="m5.582 14.605.006.032c.378 1.815.999 3.326 1.988 4.387 1.007 1.079 2.354 1.649 4.077 1.649 1.268 0 2.35-.258 3.266-.802.912-.542 1.624-1.345 2.191-2.378.799-1.283 1.348-3.015 1.783-4.446l.11-.343c.089-.277.183-.57.263-.84.11-.371.215-.766.231-1.042a1.279 1.279 0 0 0-.311-.949 1.31 1.31 0 0 0-.9-.422 1.408 1.408 0 0 0-1.041.326c-.278.232-.485.565-.664.941l-.003.004-.681 1.466.314-7.196V4.97c0-.787-.625-1.412-1.412-1.412a1.4 1.4 0 0 0-1.404 1.396l-.122 2.022-.084-3.071A1.404 1.404 0 0 0 11.776 2.5c-.782 0-1.404.628-1.404 1.412h0v.014l.105 3.766-.407-3.226a1.399 1.399 0 0 0-1.404-1.37 1.401 1.401 0 0 0-1.409 1.458l.493 4.601-.434-2.254A1.4 1.4 0 0 0 5.912 5.55c-.784 0-1.412.622-1.412 1.404a.55.55 0 0 0 .005.07l1.077 7.581Z"
      style={{
        fill: 'none',
        fillRule: 'nonzero',
        stroke: 'currentColor',
        strokeWidth: 1,
      }}
    />
  </svg>
);

export default SvgHandIcon;

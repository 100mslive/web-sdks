import * as React from 'react';
import { SVGProps } from 'react';

const SvgCodeIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M14.525 3.036c.54.146.86.7.714 1.242l-4.522 16.817a1.011 1.011 0 0 1-1.242.714c-.54-.146-.86-.7-.714-1.241L13.283 3.75a1.012 1.012 0 0 1 1.242-.715Zm-7.508 4.36a1.013 1.013 0 0 1 0 1.433l-3.575 3.575 3.58 3.618a1.013 1.013 0 1 1-1.442 1.425l-4.287-4.333A1.01 1.01 0 0 1 1 12.35c.012-.242.11-.482.296-.667l4.287-4.287a1.017 1.017 0 0 1 1.433 0Zm11.35-.006 4.332 4.287c.166.164.263.371.291.585.042.304-.053.623-.287.856l-4.333 4.333a1.02 1.02 0 0 1-1.433 0 1.013 1.013 0 0 1 0-1.433l3.614-3.615-3.61-3.572a1.013 1.013 0 1 1 1.425-1.442Z"
      fill="currentColor"
    />
  </svg>
);

export default SvgCodeIcon;

import type { SVGProps } from 'react';
import * as React from 'react';
const SvgTranscriptIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="none" viewBox="0 0 24 24" {...props}>
    <path stroke="currentColor" strokeDasharray="8 3" strokeLinecap="round" strokeWidth={1.5} d="M7 15h10" />
    <path stroke="currentColor" strokeDasharray="3 3" strokeLinecap="round" strokeWidth={1.5} d="M7 12h10" />
    <rect width={16.75} height={12.75} x={3.625} y={5.625} stroke="currentColor" strokeWidth={1.25} rx={2.875} />
  </svg>
);
export default SvgTranscriptIcon;

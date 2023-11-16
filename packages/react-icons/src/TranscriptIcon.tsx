import * as React from 'react';
import { SVGProps } from 'react';
const SvgTranscriptIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M7 15h10" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeDasharray="8 3" />
    <path d="M7 12h10" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeDasharray="3 3" />
    <rect x={3.625} y={5.625} width={16.75} height={12.75} rx={2.875} stroke="currentColor" strokeWidth={1.25} />
  </svg>
);
export default SvgTranscriptIcon;

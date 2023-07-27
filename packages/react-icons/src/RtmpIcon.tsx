import * as React from 'react';
import { SVGProps } from 'react';
const SvgRtmpIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24px" height="24px" viewBox="0 0 49 50" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect x={1.368} y={22.63} width={21.148} height={21.148} rx={10.574} fill="currentColor" />
    <rect x={1.368} y={22.63} width={21.148} height={21.148} rx={10.574} fill="url(#RTMPIcon_svg__a)" />
    <rect x={1.368} y={22.63} width={21.148} height={21.148} rx={10.574} stroke="#1B1F26" />
    <rect
      x={12.286}
      y={0.786}
      width={26.527}
      height={27.423}
      rx={13.263}
      fill="url(#RTMPIcon_svg__b)"
      stroke="#1B1F26"
    />
    <rect x={20.243} y={21.029} width={27.893} height={27.893} rx={13.946} fill="#9146FF" />
    <rect x={20.243} y={21.029} width={27.893} height={27.893} rx={13.946} fill="url(#RTMPIcon_svg__c)" />
    <rect x={20.243} y={21.029} width={27.893} height={27.893} rx={13.946} stroke="#1B1F26" />
    <defs>
      <pattern id="RTMPIcon_svg__a" patternContentUnits="objectBoundingBox" width={1} height={1}>
        <use transform="matrix(.001 0 0 .001 .094 .095)" />
      </pattern>
      <pattern id="RTMPIcon_svg__b" patternContentUnits="objectBoundingBox" width={1} height={1}>
        <use transform="matrix(.00065 0 0 .00063 -.018 0)" />
      </pattern>
      <pattern id="RTMPIcon_svg__c" patternContentUnits="objectBoundingBox" width={1} height={1}>
        <use transform="translate(.078 .094) scale(.00117)" />
      </pattern>
    </defs>
  </svg>
);
export default SvgRtmpIcon;

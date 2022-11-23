import * as React from 'react';
import { SVGProps } from 'react';
const SvgStarIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 3c.311 0 .596.177.734.456l2.338 4.737 5.228.764a.818.818 0 0 1 .453 1.395l-3.783 3.685.893 5.205a.818.818 0 0 1-1.188.862L12 17.645l-4.676 2.46a.818.818 0 0 1-1.187-.863l.893-5.205-3.783-3.685A.818.818 0 0 1 3.7 8.957l5.228-.764 2.338-4.737A.818.818 0 0 1 12 3Zm0 2.667-1.794 3.635a.818.818 0 0 1-.616.448l-4.014.586 2.904 2.829a.818.818 0 0 1 .236.724l-.686 3.995 3.59-1.887a.818.818 0 0 1 .76 0l3.59 1.887-.686-3.995a.818.818 0 0 1 .236-.724l2.904-2.829-4.014-.586a.818.818 0 0 1-.616-.448L12 5.667Z"
      fill="currentColor"
    />
  </svg>
);
export default SvgStarIcon;

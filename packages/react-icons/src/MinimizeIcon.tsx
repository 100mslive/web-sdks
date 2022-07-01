import * as React from 'react';

function SvgMinimizeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M19.766 4.234a.8.8 0 010 1.132L15.53 9.6H18.4a.8.8 0 110 1.6h-4.8a.796.796 0 01-.733-.478.798.798 0 01-.067-.322V5.6a.8.8 0 011.6 0v2.869l4.234-4.235a.8.8 0 011.132 0zM10.4 12.8H5.6a.8.8 0 000 1.6h2.869l-4.235 4.234a.8.8 0 001.132 1.132L9.6 15.53V18.4a.8.8 0 101.6 0v-4.8a.796.796 0 00-.478-.733.798.798 0 00-.322-.067z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgMinimizeIcon;

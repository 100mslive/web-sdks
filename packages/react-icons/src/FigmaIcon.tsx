import * as React from 'react';

function SvgFigmaIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 3a3.001 3.001 0 000 6 3.001 3.001 0 000 6h3v-3a3.001 3.001 0 006 0c0-1.656-1.344-3-3-3a3.001 3.001 0 000-6H9zm6 6h-3v3c0-1.656 1.344-3 3-3zM9 21c1.656 0 3-1.344 3-3v-3H9a3.001 3.001 0 000 6z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgFigmaIcon;

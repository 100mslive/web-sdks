import * as React from 'react';

function SvgAlertIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.843 4.303a2.359 2.359 0 013.174.832l.002.004 6.659 11.116.006.011a2.359 2.359 0 01-2.017 3.538H5.333a2.358 2.358 0 01-2.017-3.538l.006-.01 6.66-11.117.674.404-.673-.408c.21-.346.507-.633.86-.832zm.486 1.646L4.675 17.057a.786.786 0 00.671 1.175h13.308a.786.786 0 00.67-1.175L12.673 5.951v-.002a.786.786 0 00-1.343 0zM12 8.798c.434 0 .786.352.786.786v3.145a.786.786 0 01-1.572 0V9.584c0-.434.352-.786.786-.786zm0 6.289a.786.786 0 000 1.572h.008a.786.786 0 000-1.572H12z"
        fill="#E0ECFF"
        fillOpacity={0.8}
      />
    </svg>
  );
}

export default SvgAlertIcon;

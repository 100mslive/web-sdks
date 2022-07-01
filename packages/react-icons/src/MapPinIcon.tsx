import * as React from 'react';

function SvgMapPinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.257 6.257A6 6 0 0117.5 10.5c0 2.324-1.512 4.578-3.17 6.328a22.08 22.08 0 01-2.83 2.502 22.07 22.07 0 01-2.83-2.502C7.011 15.078 5.5 12.824 5.5 10.5a6 6 0 011.757-4.243zm3.827 14.617l.416-.624.416.624a.75.75 0 01-.832 0zm0 0l.416-.624c.416.624.417.624.417.623h.002l.005-.004.017-.011a8.367 8.367 0 00.288-.204 23.57 23.57 0 003.19-2.795C17.137 16.048 19 13.428 19 10.5a7.5 7.5 0 00-15 0c0 2.927 1.863 5.547 3.58 7.36a23.58 23.58 0 003.417 2.955l.062.043.018.011.005.003.002.002zM10 10.5a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm1.5-3a3 3 0 100 6 3 3 0 000-6z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgMapPinIcon;

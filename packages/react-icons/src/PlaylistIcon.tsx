import * as React from 'react';

function SvgPlaylistIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M5.897 6.795h12.206a.897.897 0 000-1.795H5.897a.897.897 0 100 1.795zM18.102 8.949H12a.898.898 0 000 1.795h6.102a.897.897 0 100-1.795zM18.102 13.256H12a.898.898 0 000 1.795h6.102a.897.897 0 000-1.795zM18.103 17.205H5.897a.897.897 0 100 1.795h12.206a.897.897 0 000-1.795zM5.982 9.183a.718.718 0 00-.444.663v4.308a.718.718 0 001.227.508l2.154-2.154a.718.718 0 000-1.016L6.765 9.338a.718.718 0 00-.783-.155z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgPlaylistIcon;

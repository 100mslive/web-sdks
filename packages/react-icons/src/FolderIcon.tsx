import * as React from 'react';

function SvgFolderIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.455 5.636a.818.818 0 00-.819.819v11.454a.818.818 0 00.819.818h13.09a.818.818 0 00.819-.818v-9a.818.818 0 00-.819-.818h-7.363a.818.818 0 01-.681-.364l-1.393-2.09H5.455zM3.719 4.72A2.455 2.455 0 015.455 4h4.09c.274 0 .53.137.681.364l1.394 2.09h6.926A2.455 2.455 0 0121 8.91v9a2.454 2.454 0 01-2.454 2.455H5.455A2.455 2.455 0 013 17.909V6.455c0-.651.259-1.276.719-1.736z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgFolderIcon;

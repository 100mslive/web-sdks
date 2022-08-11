import * as React from 'react';

function SvgPhotoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.4 5.6a.8.8 0 00-.8.8v11.2a.8.8 0 00.52.75l8.514-8.516a.8.8 0 011.132 0L18.4 12.47V6.4a.8.8 0 00-.8-.8H6.4zm12 9.131l-3.2-3.2L8.331 18.4H17.6a.8.8 0 00.8-.8v-2.869zM4 6.4A2.4 2.4 0 016.4 4h11.2A2.4 2.4 0 0120 6.4v11.2a2.4 2.4 0 01-2.4 2.4H6.4A2.4 2.4 0 014 17.6V6.4zm5.2 2.4a.4.4 0 100 .8.4.4 0 000-.8zm-2 .4a2 2 0 114 0 2 2 0 01-4 0z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgPhotoIcon;

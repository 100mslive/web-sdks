import * as React from 'react';

function SvgAnnouncementIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20 6.8a.8.8 0 00-1.014-.77l-14.4 4A.8.8 0 004 10.8v2.4c0 .375.26.7.626.781l1.562.347a3.207 3.207 0 006.245 1.388l6.593 1.465A.8.8 0 0020 16.4V6.8zm-9.137 8.567l-3.105-.69a1.608 1.608 0 003.105.69zM5.6 12.558v-1.15l12.8-3.555v7.55L5.6 12.558z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgAnnouncementIcon;

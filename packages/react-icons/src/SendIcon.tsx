import * as React from 'react';

function SvgSendIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.7 3.195c.394-.07.8-.013 1.16.164l.007.004 14.26 7.245a1.313 1.313 0 01.718 1.162v.01a1.313 1.313 0 01-.717 1.168L5.859 20.206a1.875 1.875 0 01-2.451-2.622l3.554-5.806-3.554-5.796A1.875 1.875 0 014.7 3.195zm13.623 7.832L5.193 4.703a.375.375 0 00-.496.511l3.74 5.813h9.886zm-9.924 1.5h9.924l-13.13 6.335a.374.374 0 01-.496-.511L8.4 12.527z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgSendIcon;

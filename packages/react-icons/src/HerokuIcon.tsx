import * as React from 'react';

function SvgHerokuIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M19.2 2A1.8 1.8 0 0121 3.8v16.4a1.8 1.8 0 01-1.8 1.8H4.8A1.8 1.8 0 013 20.2V3.8A1.8 1.8 0 014.8 2h14.4zm0 1H4.8a.8.8 0 00-.8.8v16.4c0 .441.359.8.8.8h14.4a.8.8 0 00.8-.8V3.8a.8.8 0 00-.8-.8zM7.75 15L10 17l-2.25 2v-4zm2-10v5.678c.998-.325 2.394-.678 3.75-.678 1.236 0 1.976.486 2.38.894.824.833.869 1.886.87 2.085V19h-2v-5.973C14.74 12.562 14.515 12 13.5 12c-1.942 0-4.11.933-4.32 1.026l-.017.007-1.413.64V5h2zm7 0c-.135 1.136-.596 2.225-1.5 3.25h-2c.786-1.031 1.28-2.117 1.5-3.25h2z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgHerokuIcon;

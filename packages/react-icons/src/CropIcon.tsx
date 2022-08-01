import * as React from 'react';

function SvgCropIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.347 3.756a.75.75 0 10-1.5-.012L6.821 6.82l-3.077.027a.75.75 0 00.012 1.5l3.052-.027-.058 6.672V15A2.25 2.25 0 009 17.25h6.75v3a.75.75 0 001.5 0v-3h3a.75.75 0 000-1.5h-3V9A2.25 2.25 0 0015 6.75l-6.679.058.026-3.051zm-.039 4.552l-.058 6.695a.75.75 0 00.75.747h6.75V9a.75.75 0 00-.747-.75l-6.695.058z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgCropIcon;

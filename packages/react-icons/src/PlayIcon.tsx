import * as React from 'react';

function SvgPlayIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M12 4.125a7.875 7.875 0 100 15.75 7.875 7.875 0 000-15.75zm3.572 8.57l-4.5 3.094a.84.84 0 01-.801.085.842.842 0 01-.521-.78V8.906a.844.844 0 011.322-.695l4.5 3.094a.845.845 0 010 1.39z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgPlayIcon;

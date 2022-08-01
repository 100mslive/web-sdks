import * as React from 'react';

function SvgShuffleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18.981 4.25a.799.799 0 01.219.55v4a.8.8 0 01-1.6 0V6.731L5.366 18.966a.8.8 0 01-1.132-1.132L16.47 5.6H14.4a.8.8 0 010-1.6h4a.797.797 0 01.581.25zM19.2 15.2a.8.8 0 00-1.6 0v2.069l-3.434-3.435a.8.8 0 00-1.132 1.132L16.47 18.4H14.4a.8.8 0 000 1.6h4a.797.797 0 00.8-.8v-4zM5.366 5.034a.8.8 0 00-1.132 1.132l4 4a.8.8 0 001.132-1.132l-4-4z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgShuffleIcon;

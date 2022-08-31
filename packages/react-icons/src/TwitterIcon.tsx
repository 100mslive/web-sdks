import * as React from 'react';

function SvgTwitterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M9 0a9.001 9.001 0 000 18A9.001 9.001 0 009 0zm4.11 7.017c.003.089.005.178.005.267 0 2.73-2.078 5.878-5.877 5.878a5.847 5.847 0 01-3.167-.928 4.144 4.144 0 003.058-.856A2.068 2.068 0 015.2 9.943a2.056 2.056 0 00.934-.035 2.066 2.066 0 01-1.657-2.051c.278.154.597.247.935.258a2.064 2.064 0 01-.64-2.758A5.865 5.865 0 009.03 7.515a2.066 2.066 0 013.52-1.884c.47-.092.913-.264 1.312-.5a2.074 2.074 0 01-.909 1.142 4.12 4.12 0 001.187-.326 4.2 4.2 0 01-1.03 1.07z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgTwitterIcon;

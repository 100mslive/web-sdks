import * as React from 'react';

function SvgDividerIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path stroke="#777" strokeOpacity={0.5} d="M12 0v30" />
    </svg>
  );
}

export default SvgDividerIcon;

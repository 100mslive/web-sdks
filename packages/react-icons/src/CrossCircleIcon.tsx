import * as React from 'react';

function SvgCrossCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 4.636a7.364 7.364 0 100 14.728 7.364 7.364 0 000-14.728zM3 12a9 9 0 1118 0 9 9 0 01-18 0zm12.033-3.033c.32.32.32.837 0 1.157L13.157 12l1.876 1.876a.818.818 0 01-1.157 1.157L12 13.157l-1.876 1.876a.818.818 0 01-1.157-1.157L10.843 12l-1.876-1.876a.818.818 0 111.157-1.157L12 10.843l1.876-1.876a.818.818 0 011.157 0z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgCrossCircleIcon;

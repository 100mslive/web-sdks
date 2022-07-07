import * as React from 'react';

function SvgArchiveIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.781 4.781c.5-.5 1.178-.781 1.886-.781h14.222a2.667 2.667 0 012.667 2.667v.889a2.667 2.667 0 01-1.778 2.514v7.263A2.667 2.667 0 0117.11 20H6.444a2.667 2.667 0 01-2.666-2.667V10.07A2.666 2.666 0 012 7.556v-.89c0-.707.28-1.385.781-1.885zm1.886 3.663h14.222a.889.889 0 00.889-.888v-.89a.889.889 0 00-.89-.888H4.668a.889.889 0 00-.89.889v.889a.889.889 0 00.89.888zm.889 1.778v7.111a.889.889 0 00.888.89h10.667a.889.889 0 00.889-.89v-7.11H5.556zM9.11 12.89c0-.491.398-.889.889-.889h3.556a.889.889 0 010 1.778H10a.889.889 0 01-.889-.89z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgArchiveIcon;

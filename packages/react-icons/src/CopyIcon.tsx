import * as React from 'react';

function SvgCopyIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.708 4.167c0-.806.653-1.459 1.459-1.459H15c.805 0 1.458.653 1.458 1.459v7.5c0 .805-.653 1.458-1.458 1.458h-1.667v-1.25H15a.208.208 0 00.208-.208v-7.5A.208.208 0 0015 3.958H9.167a.208.208 0 00-.209.209v1.666h-1.25V4.167zM5 6.875c-.805 0-1.458.653-1.458 1.458v7.5c0 .806.653 1.459 1.458 1.459h5.833c.806 0 1.459-.653 1.459-1.459v-7.5c0-.805-.653-1.458-1.459-1.458H5zm-.208 1.458c0-.115.093-.208.208-.208h5.833c.115 0 .209.093.209.208v7.5a.208.208 0 01-.209.209H5a.208.208 0 01-.208-.209v-7.5z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgCopyIcon;

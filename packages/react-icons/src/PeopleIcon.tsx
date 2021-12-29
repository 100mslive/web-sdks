import * as React from 'react';

function SvgPeopleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.625 4.54a3.844 3.844 0 100 7.687 3.844 3.844 0 000-7.688zM6.968 6.725a2.344 2.344 0 113.314 3.314 2.344 2.344 0 01-3.314-3.314zm-1.392 8.936a4.312 4.312 0 017.362 3.049.75.75 0 001.5 0 5.813 5.813 0 00-11.626 0 .75.75 0 001.5 0c0-1.144.455-2.24 1.264-3.05zm8.4-8.21a3.281 3.281 0 114.64 4.64 3.281 3.281 0 01-4.64-4.64zm2.32.539a1.781 1.781 0 100 3.563 1.781 1.781 0 000-3.563zm-1.177 7.537a3.395 3.395 0 014.569 3.183.75.75 0 001.5 0 4.896 4.896 0 00-6.588-4.59.75.75 0 10.52 1.407z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgPeopleIcon;

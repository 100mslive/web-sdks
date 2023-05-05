import * as React from 'react';
import { SVGProps } from 'react';

const SvgPeopleIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.625 4.54a3.844 3.844 0 1 0 0 7.687 3.844 3.844 0 0 0 0-7.688ZM6.968 6.725a2.344 2.344 0 1 1 3.314 3.314 2.344 2.344 0 0 1-3.314-3.314Zm-1.392 8.936a4.312 4.312 0 0 1 7.362 3.049.75.75 0 0 0 1.5 0 5.813 5.813 0 0 0-11.626 0 .75.75 0 0 0 1.5 0c0-1.144.455-2.24 1.264-3.05Zm8.4-8.21a3.281 3.281 0 1 1 4.64 4.64 3.281 3.281 0 0 1-4.64-4.64Zm2.32.539a1.781 1.781 0 1 0 0 3.563 1.781 1.781 0 0 0 0-3.563Zm-1.177 7.537a3.395 3.395 0 0 1 4.569 3.183.75.75 0 0 0 1.5 0 4.896 4.896 0 0 0-6.588-4.59.75.75 0 1 0 .52 1.407Z"
      fill="currentColor"
    />
  </svg>
);

export default SvgPeopleIcon;

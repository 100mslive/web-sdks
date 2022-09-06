import * as React from 'react';
import { SVGProps } from 'react';

const SvgRocketIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24px" height="24px" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M9.282 12.333 6.667 9.718m2.615 2.615a19.477 19.477 0 0 0 3.487-1.743m-3.487 1.743v4.36s2.642-.48 3.487-1.744c.942-1.412 0-4.36 0-4.36m-6.102-.871A19.18 19.18 0 0 1 8.41 6.275 11.229 11.229 0 0 1 18 1c0 2.371-.68 6.539-5.23 9.59m-6.103-.872h-4.36s.48-2.641 1.744-3.487c1.413-.942 4.36 0 4.36 0m-5.667 7.41C1.436 14.74 1 18 1 18s3.26-.436 4.359-1.744c.619-.732.61-1.857-.079-2.537a1.9 1.9 0 0 0-2.536-.078Z"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default SvgRocketIcon;

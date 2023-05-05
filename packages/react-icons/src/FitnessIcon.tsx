import * as React from 'react';
import { SVGProps } from 'react';

const SvgFitnessIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M16.5 6.909c-.822 0-1.587.224-2.25.599v-.423c0-.777.312-1.507.879-2.057L14.069 4a4.286 4.286 0 0 0-1.32 3.085v.423a4.555 4.555 0 0 0-2.25-.599c-1.33 0-2.524.564-3.348 1.455H5.25c-1.242 0-2.25.977-2.25 2.182v4.364c0 1.205 1.008 2.182 2.25 2.182h2.261A7.561 7.561 0 0 0 13.501 20C17.64 20 21 16.744 21 12.727v-1.454c0-2.41-2.015-4.364-4.5-4.364ZM5.25 9.819h1.01a4.23 4.23 0 0 0-.261 1.454H5.25a.739.739 0 0 1-.75-.727c0-.401.335-.727.75-.727Zm2.25 5.818v-1.454H6v1.454h-.75a.738.738 0 0 1-.75-.727h-.002.002v-2.316c.236.081.486.134.75.134H12v2.909h-1.5v-1.454H9v1.454H7.5Zm12-2.91c0 3.208-2.692 5.818-6 5.818a6.073 6.073 0 0 1-3.954-1.454H13.5v-5.818H7.498v-.002c0-1.602 1.347-2.908 3-2.908.737 0 1.446.265 2 .746l1 .872 1.003-.872a3.045 3.045 0 0 1 1.999-.746c1.655 0 3 1.305 3 2.91v1.454Z"
      fill="currentColor"
    />
  </svg>
);

export default SvgFitnessIcon;

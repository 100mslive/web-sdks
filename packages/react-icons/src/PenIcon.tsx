import * as React from 'react';

function SvgPenIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.24 3.24a.818.818 0 01.785-.213l11.849 2.86c.31.074.548.322.61.634l.944 4.718a.818.818 0 01.878.182l2.454 2.455c.32.32.32.838 0 1.157l-5.727 5.727a.818.818 0 01-1.157 0l-2.454-2.454a.818.818 0 01-.184-.878l-4.717-.944a.818.818 0 01-.635-.61l-2.86-11.85a.821.821 0 01.214-.784zm5.727 6.884L5.296 6.453l2.059 8.529 5.194 1.039 3.472-3.472-1.039-5.194-8.529-2.06 3.67 3.671a2.455 2.455 0 11-1.157 1.157zm1.626.49a.818.818 0 10.01-.01l-.01.01zm3.862 8.41l-1.298-1.297 4.57-4.57 1.298 1.298-4.57 4.57z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgPenIcon;

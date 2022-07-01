import * as React from 'react';

function SvgVerticalMenu(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M12 7.003c1.123 0 2-.881 2-2.006A1.997 1.997 0 0012 3c-1.094 0-2 .89-2 1.997 0 1.097.906 2.006 2 2.006zm0 6.975c1.123 0 2-.872 2-1.978a2 2 0 00-4 0c0 1.088.906 1.978 2 1.978zM12 21c1.123 0 2-.881 2-1.997a1.999 1.999 0 00-2-2.006c-1.094 0-2 .89-2 2.006 0 1.088.906 1.997 2 1.997z"
        fill="currentColor"
        fillOpacity={0.95}
      />
    </svg>
  );
}

export default SvgVerticalMenu;

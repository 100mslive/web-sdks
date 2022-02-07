import * as React from 'react';

function SvgChatUnreadIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20 13.167v2.262a1.632 1.632 0 01-1.633 1.632h-6.64L7.985 19.87a.653.653 0 01-1.045-.522V17.06H5.633A1.633 1.633 0 014 15.43V5.633A1.633 1.633 0 015.633 4h5.2c-.18.416-.322.853-.42 1.306h-4.78a.327.327 0 00-.327.327v9.796a.327.327 0 00.327.326h1.959c.36 0 .653.292.653.653v1.633l2.873-2.155a.653.653 0 01.392-.13h6.857a.327.327 0 00.327-.327v-1.843c.453-.097.89-.239 1.306-.42z"
        fill="currentColor"
      />
      <rect x={12} y={2} width={10} height={10} rx={5} fill="#2F80FF" />
    </svg>
  );
}

export default SvgChatUnreadIcon;

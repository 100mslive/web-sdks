import * as React from 'react';

function SvgVideoOnIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.583 8.375c0-.437.355-.792.792-.792h8.708c.438 0 .792.355.792.792v7.917a.792.792 0 01-.792.791H5.375a.792.792 0 01-.792-.791V8.375zm11.875 2.42v-2.42A2.375 2.375 0 0014.083 6H5.375A2.375 2.375 0 003 8.375v7.917a2.375 2.375 0 002.375 2.375h8.708a2.375 2.375 0 002.375-2.375v-2.42l4.29 3.064A.792.792 0 0022 16.292V8.375a.792.792 0 00-1.252-.644l-4.29 3.064zm3.959 3.958l-3.388-2.42 3.388-2.42v4.84z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgVideoOnIcon;

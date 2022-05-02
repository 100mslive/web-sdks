import * as React from 'react';

function SvgWrench(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.469 2.862a5.96 5.96 0 013.623.68.75.75 0 01.171 1.188l-2.7 2.7a.374.374 0 000 .53l.6.6a.375.375 0 00.53 0l2.663-2.659a.75.75 0 011.2.195 5.962 5.962 0 01-7.399 8.262l-6.27 6.27a1.91 1.91 0 01-2.699 0l-.817-.818a1.907 1.907 0 010-2.698l6.275-6.271a5.96 5.96 0 014.823-7.979zm1.935 1.606a4.46 4.46 0 00-5.194 6.224.75.75 0 01-.147.854l-6.632 6.627a.407.407 0 000 .576l.819.82a.407.407 0 00.576 0l6.627-6.628a.75.75 0 01.853-.147 4.46 4.46 0 006.276-4.998l-1.828 1.826a1.876 1.876 0 01-2.651 0l-.6-.6a1.876 1.876 0 010-2.653l1.901-1.9z"
        fill="#000"
      />
    </svg>
  );
}

export default SvgWrench;

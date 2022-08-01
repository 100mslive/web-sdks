import * as React from 'react';

function SvgRepeatIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.851 3.24a.818.818 0 00-1.157 1.157l1.876 1.876H8.09A4.09 4.09 0 004 10.363v.819a.818.818 0 101.636 0v-.818a2.455 2.455 0 012.455-2.455h9.48l-1.877 1.876a.818.818 0 001.157 1.157l3.273-3.273a.815.815 0 00.24-.578.815.815 0 00-.243-.582l-3.27-3.27zM8.67 13.058c.32.32.32.837 0 1.157L6.793 16.09h9.48a2.455 2.455 0 002.454-2.455v-.818a.818.818 0 111.637 0v.818a4.091 4.091 0 01-4.091 4.091h-9.48l1.876 1.876a.818.818 0 01-1.157 1.157L4.24 17.488a.815.815 0 01.002-1.16l3.27-3.27a.818.818 0 011.157 0z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgRepeatIcon;

import * as React from 'react';

function SvgMouseClickIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.663 4.607a.819.819 0 10-1.582.424l.637 2.372a.819.819 0 101.581-.424l-.636-2.372zm5.325 2.274a.819.819 0 10-1.158-1.158L11.093 7.46A.819.819 0 0012.25 8.62l1.737-1.738zm-9.957 1.2a.819.819 0 00-.424 1.581l2.373.637a.819.819 0 00.424-1.582L4.031 8.08zM7.62 13.25a.819.819 0 00-1.159-1.158L4.724 13.83a.819.819 0 101.159 1.157l1.736-1.737zm1.158-3.474a.819.819 0 01.894-.177l9.826 4.095a.819.819 0 01-.052 1.53l-3.032 1.03 2.786 2.786a.819.819 0 01-1.158 1.158l-2.786-2.786-1.03 3.032a.819.819 0 01-1.53.052L8.6 10.67a.819.819 0 01.177-.894zm2.1 2.1l2.495 5.988.755-2.225a.82.82 0 01.513-.512l2.225-.756-5.988-2.495z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgMouseClickIcon;

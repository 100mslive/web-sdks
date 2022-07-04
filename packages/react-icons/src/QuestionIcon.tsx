import * as React from 'react';

function SvgQuestionIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 4.636a7.364 7.364 0 100 14.728 7.364 7.364 0 000-14.728zM3 12a9 9 0 1118 0 9 9 0 01-18 0zm9.211-3.253a1.637 1.637 0 00-1.82 1.07.818.818 0 11-1.544-.543 3.273 3.273 0 016.36 1.09c0 1.252-.928 2.08-1.591 2.521a6.593 6.593 0 01-1.38.694l-.028.01-.01.003-.002.002h-.002l-.26-.776.26.776a.818.818 0 01-.519-1.552l.013-.004.06-.023a4.954 4.954 0 00.96-.492c.564-.375.863-.776.863-1.16a1.636 1.636 0 00-1.36-1.616zM12 15.273a.818.818 0 100 1.636h.008a.818.818 0 100-1.636H12z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgQuestionIcon;

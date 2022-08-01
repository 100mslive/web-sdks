import * as React from 'react';

function SvgSlackIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 21a9 9 0 100-18 9 9 0 000 18zM10.52 6.37c.653 0 1.181.53 1.182 1.182v1.186h-1.183a1.184 1.184 0 010-2.367zm-4.14 7.118a1.184 1.184 0 002.367 0v-1.184H7.564c-.654 0-1.184.53-1.184 1.184zm4.14-1.183c-.654 0-1.183.53-1.183 1.183v2.958a1.183 1.183 0 002.365 0v-2.958c0-.653-.53-1.183-1.183-1.183zm-2.964-.6h2.963a1.184 1.184 0 000-2.367H7.556a1.184 1.184 0 000 2.366zm7.699-1.187a1.18 1.18 0 011.181-1.18h.001a1.184 1.184 0 010 2.366h-1.182v-1.186zM12.3 7.554v2.967a1.183 1.183 0 002.365 0V7.554a1.183 1.183 0 00-2.365 0zm1.182 7.708a1.183 1.183 0 11-1.183 1.184v-1.184h1.183zm2.963-2.958h-2.963a1.184 1.184 0 000 2.367h2.963a1.184 1.184 0 000-2.367z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SvgSlackIcon;

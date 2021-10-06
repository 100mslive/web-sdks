import * as React from 'react';

function SvgMicOnIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            width="24px"
            height="24px"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}>
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M14.298 11.659V6.163a2.298 2.298 0 00-4.596 0v5.496a2.298 2.298 0 004.596 0zM12 2.5a3.663 3.663 0 00-3.663 3.663v5.496a3.663 3.663 0 007.326 0V6.163A3.663 3.663 0 0012 2.5zm-.683 15.914v2.403a.683.683 0 001.366 0v-2.403a6.79 6.79 0 006.106-6.754V9.822a.683.683 0 00-1.366 0v1.838a5.423 5.423 0 01-10.846 0V9.822a.683.683 0 00-1.366 0v1.838a6.79 6.79 0 006.106 6.754z"
                fill="currentColor"
            />
        </svg>
    );
}

export default SvgMicOnIcon;

import * as React from 'react';

function SvgPersonIcon(props: React.SVGProps<SVGSVGElement>) {
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
                d="M12 2.813a4.687 4.687 0 100 9.374 4.687 4.687 0 000-9.374zM9.746 5.245a3.188 3.188 0 114.508 4.508 3.188 3.188 0 01-4.508-4.508zM8.012 16.45a5.64 5.64 0 019.628 3.988.75.75 0 001.5 0 7.14 7.14 0 00-14.28 0 .75.75 0 001.5 0 5.64 5.64 0 011.652-3.988z"
                fill="currentColor"
            />
        </svg>
    );
}

export default SvgPersonIcon;

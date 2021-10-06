import * as React from 'react';

function SvgShareScreenIcon(props: React.SVGProps<SVGSVGElement>) {
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
                d="M21.2 8a2.75 2.75 0 00-2.75-2.75H5.55A2.75 2.75 0 002.8 8v7.64a2.75 2.75 0 002.75 2.75h3.075a.75.75 0 000-1.5H5.55c-.69 0-1.25-.56-1.25-1.25V8c0-.69.56-1.25 1.25-1.25h12.9c.69 0 1.25.56 1.25 1.25v7.64c0 .69-.56 1.25-1.25 1.25h-2.7a.75.75 0 000 1.5h2.7a2.75 2.75 0 002.75-2.75V8zM8.008 13.307a.925.925 0 101.309 1.308l1.89-1.89v6.839a.925.925 0 001.85 0v-6.839l1.89 1.89a.925.925 0 101.309-1.308l-3.47-3.47a.926.926 0 00-1.308 0l-3.47 3.47z"
                fill="currentColor"
            />
        </svg>
    );
}

export default SvgShareScreenIcon;

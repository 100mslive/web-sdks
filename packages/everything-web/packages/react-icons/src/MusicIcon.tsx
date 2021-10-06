import * as React from 'react';

function SvgMusicIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg width={24} height={24} fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path
                d="M5 16.94a2.059 2.059 0 104.118 0 2.059 2.059 0 00-4.118 0v0zM14.882 14.47a2.059 2.059 0 104.118 0 2.059 2.059 0 00-4.118 0z"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M19 14.47V4.746a.57.57 0 00-.723-.549L9.529 6.721a.572.572 0 00-.418.548v9.672M9.118 10.764L19 8.294"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export default SvgMusicIcon;

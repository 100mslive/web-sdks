import * as React from 'react';

function SvgInviteStageIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            width="24px"
            height="24px"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}>
            <path
                d="M8.267 4v14.933a1.067 1.067 0 01-2.134 0M6.133 18.933V8.267"
                stroke="currentColor"
                strokeWidth={1.067}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M6.133 18.933a1.067 1.067 0 01-2.133 0V5.067A1.067 1.067 0 015.067 4h13.866A1.067 1.067 0 0120 5.067v13.866a1.067 1.067 0 01-2.133 0v-1.066M8.267 18.4h2.666"
                stroke="currentColor"
                strokeWidth={1.067}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M12 15.733v-1.6a2.667 2.667 0 015.333 0v1.6h-1.066L15.733 20H13.6l-.533-4.267H12zM12.533 8.267a2.133 2.133 0 104.267 0 2.133 2.133 0 00-4.267 0v0z"
                stroke="currentColor"
                strokeWidth={1.067}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export default SvgInviteStageIcon;

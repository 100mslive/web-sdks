import * as React from 'react';

function SvgChatIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg width={24} height={24} fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M4.688 4.313a.375.375 0 00-.375.375v11.25a.375.375 0 00.375.374h2.25a.75.75 0 01.75.75v1.875l3.3-2.475a.75.75 0 01.45-.15h7.874a.375.375 0 00.375-.375V4.688a.375.375 0 00-.375-.375H4.688zm-1.326-.951c.351-.352.828-.55 1.325-.55h14.625a1.875 1.875 0 011.875 1.876v11.25a1.875 1.875 0 01-1.875 1.874h-7.625l-4.3 3.226a.75.75 0 01-1.2-.6v-2.625h-1.5a1.875 1.875 0 01-1.875-1.875V4.688c0-.498.198-.975.55-1.326z"
                fill="currentColor"
            />
        </svg>
    );
}

export default SvgChatIcon;

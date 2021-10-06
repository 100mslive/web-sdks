import * as React from 'react';

function SvgAudioPlayerIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            width="24px"
            height="24px"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}>
            <path
                d="M16.375 10.305l-4.09-2.324a.688.688 0 00-.688 0 .688.688 0 00-.358.618v4.655a.688.688 0 001.066.619l4.07-2.31a.687.687 0 000-1.245v-.013z"
                fill="currentColor"
            />
            <path
                d="M19.125 4H7.781a1.375 1.375 0 00-1.375 1.375v11.344a1.375 1.375 0 001.375 1.375h11.344a1.375 1.375 0 001.375-1.375V5.375A1.375 1.375 0 0019.125 4zm-.096 12.616a.378.378 0 01-.248.103H8.125a.344.344 0 01-.344-.344V5.719a.344.344 0 01.344-.344h10.656a.344.344 0 01.344.344v10.656c0 .09-.034.176-.096.24z"
                fill="currentColor"
            />
            <path
                d="M17.406 19.125H5.72a.344.344 0 01-.344-.344V7.094a.687.687 0 00-1.375 0v12.031A1.375 1.375 0 005.375 20.5h12.031a.687.687 0 100-1.375z"
                fill="currentColor"
            />
        </svg>
    );
}

export default SvgAudioPlayerIcon;

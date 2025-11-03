import { SVGProps } from 'react';

type Props = {
  /**
   * Adjusts width and height
   */
  size?: number | string;
  /**
   * Color of Loader
   */
  color?: string;
};

type LoadingProps = Props & SVGProps<SVGSVGElement>;

export const Loading = ({ size = 24, color = 'white', ...props }: LoadingProps) => (
  <svg width={size} height={size} viewBox="0 0 50 50" fill={color} xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="25" cy="25" r="20" stroke={color} strokeWidth="4" strokeDasharray="70 30" fill="none">
      <animateTransform
        attributeName="transform"
        attributeType="XML"
        type="rotate"
        from="0 25 25"
        to="360 25 25"
        dur="1s"
        repeatCount="indefinite"
      />
    </circle>
  </svg>
);

import React from 'react';
import { VariantProps } from '@stitches/react';
import { getAvatarBg } from './getAvatarBg';
import { styled } from '../Theme';
import { flexCenter } from '../utils/styles';

const getAvatarShape = (radii: string) => ({
  borderRadius: radii,
});

export const StyledAvatar = styled('div', {
  ...flexCenter,
  color: '$white',
  fontFamily: '$sans',
  aspectRatio: 1,
  fontWeight: 600,
  fontSize: '1.8rem',
  variants: {
    shape: {
      circle: getAvatarShape('$round'),
      square: getAvatarShape('$1'),
    },
    size: {
      small: {
        height: '48px',
      },
      medium: {
        height: '64px',
      },
      large: {
        height: '80px',
      },
    },
  },
  defaultVariants: {
    shape: 'circle',
    size: 'medium',
  },
});

type Props = VariantProps<typeof StyledAvatar> &
  React.ComponentProps<typeof StyledAvatar> & {
    name: string;
  };

export const Avatar: React.FC<Props> = ({ name, css, ...props }) => {
  const { initials, color } = getAvatarBg(name);
  return (
    <StyledAvatar css={{ bg: color, ...css }} {...props}>
      {initials}
    </StyledAvatar>
  );
};

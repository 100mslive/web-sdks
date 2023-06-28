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
  fontSize: '$space$9',
  variants: {
    shape: {
      circle: getAvatarShape('$round'),
      square: getAvatarShape('$1'),
    },
    size: {
      small: {
        height: '$16 !important',
        fontSize: '$space$6'
      },
      medium: {
        height: '$18 !important',
        fontSize: '$space$10'
      },
      large: {
        height: '$20 !important',
        fontSize: '$space$12',
      },
    },
  },
  defaultVariants: {
    shape: 'circle',
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

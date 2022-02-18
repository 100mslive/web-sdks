import { VariantProps } from '@stitches/react';
import { styled } from '../Theme';
import { flexCenter } from '../utils/styles';
import { getAvatarBg } from './getAvatarBg';
import React from 'react';

const getAvatarShape = (radii: string) => ({
  borderRadius: radii,
});

export const StyledAvatar = styled('div', {
  ...flexCenter,
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'translateX(-50%) translateY(-50%)',
  color: 'white',
  aspectRatio: 1,
  padding: '5%',
  fontWeight: 600,
  fontSize: '1.8rem',
  variants: {
    shape: {
      circle: getAvatarShape('$round'),
      square: getAvatarShape('$2'),
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

export const Avatar: React.FC<Props> = ({ name, ...props }) => {
  const { initials, color } = getAvatarBg(name);
  return (
    <StyledAvatar css={{ bg: color }} {...props}>
      {initials}
    </StyledAvatar>
  );
};

import { VariantProps } from '@stitches/react';
import { styled } from '../stitches.config';
import { flexCenter } from '../utils/styles';
import { getAvatarBg } from './getAvatarBg';
import React from 'react';

const getAvatarSize = (size: string, textSize: string) => ({
  width: size,
  height: size,
  fontSize: textSize,
});

const getAvatarShape = (radii: string) => ({
  borderRadius: radii,
});

export const StyledAvatar = styled('div', {
  ...flexCenter,
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'translateX(-50%) translateY(-50%)',
  color: '$fg',
  width: '$4',
  height: '$4',
  fontWeight: 600,
  variants: {
    size: {
      xs: getAvatarSize('20px', '8px'),
      sm: getAvatarSize('84px', '32px'),
      md: getAvatarSize('162px', '60px'),
      lg: getAvatarSize('273px', '120px'),
    },
    shape: {
      circle: getAvatarShape('$round'),
      square: getAvatarShape('$2'),
    },
  },
  defaultVariants: {
    shape: 'circle',
    size: 'md',
  },
});

type Props = VariantProps<typeof StyledAvatar> &
  React.ComponentProps<typeof StyledAvatar> & {
    name: string;
  };

export const Avatar: React.FC<Props> = ({ name, size, ...props }) => {
  const { initials, color } = getAvatarBg(name);
  return (
    <StyledAvatar css={{ bg: color }} size={size} {...props}>
      {initials}
    </StyledAvatar>
  );
};

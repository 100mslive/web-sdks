import { VariantProps } from '@stitches/react';
import { styled } from '../Theme';
import { flexCenter } from '../utils/styles';
import { getAvatarBg } from './getAvatarBg';
import React from 'react';
import { useTheme } from '../Theme';

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
  fontSize: '1.8rem',
  variants: {
    shape: {
      circle: getAvatarShape('$round'),
      square: getAvatarShape('$1'),
    },
  },
  padding: 'calc(1.25rem + 5%)',
  width: 'calc(1.5rem + 10%)',
  defaultVariants: {
    shape: 'circle',
  },
});

type Props = VariantProps<typeof StyledAvatar> &
  React.ComponentProps<typeof StyledAvatar> & {
    name: string;
  };

export const Avatar: React.FC<Props> = ({ name, css, ...props }) => {
  const { avatarSalt } = useTheme();
  const { initials, color } = getAvatarBg(name, avatarSalt);
  return (
    <StyledAvatar css={{ bg: color, ...css }} {...props}>
      {initials}
    </StyledAvatar>
  );
};

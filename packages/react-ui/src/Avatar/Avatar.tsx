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
  padding: '5%',
  fontWeight: 600,
  fontSize: '1.8rem',
  minHeight: 0,
  variants: {
    shape: {
      circle: getAvatarShape('$round'),
      square: getAvatarShape('$1'),
    },
  },
  defaultVariants: {
    shape: 'circle',
  },
});

const InitialsContainer = styled('div', {
  variants: {
    initials: {
      single: {
        padding: '0.5ch',
      },
    },
  },
});

type Props = VariantProps<typeof StyledAvatar> &
  React.ComponentProps<typeof StyledAvatar> & {
    name: string;
  };

export const Avatar: React.FC<Props> = ({ name, css, ...props }) => {
  const { initials, color } = getAvatarBg(name);
  const isInitialsSingleLetter = initials.length === 1;
  return (
    <StyledAvatar css={{ bg: color, ...css }} {...props}>
      <InitialsContainer initials={isInitialsSingleLetter ? 'single' : undefined}>{initials}</InitialsContainer>
    </StyledAvatar>
  );
};

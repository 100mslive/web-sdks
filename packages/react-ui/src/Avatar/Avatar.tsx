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
    initial: {
      single: {
        '&:before': {
          display: 'inline-block',
          content: '',
          width: '0.5ch',
        },
        '&:after': {
          display: 'inline-block',
          content: '',
          width: '0.5ch',
        },
      },
      double: {},
    },
  },
  defaultVariants: {
    shape: 'circle',
    initial: 'double',
  },
});

type Props = VariantProps<typeof StyledAvatar> &
  React.ComponentProps<typeof StyledAvatar> & {
    name: string;
  };

export const Avatar: React.FC<Props> = ({ name, css, ...props }) => {
  const { initials, color } = getAvatarBg(name);
  return (
    <StyledAvatar css={{ bg: color, ...css }} {...props} initial={initials.length === 1 ? 'single' : 'double'}>
      {initials}
    </StyledAvatar>
  );
};

import React from 'react';
import { PersonIcon } from '@100mslive/react-icons';
import type { HTMLStyledProps } from '../styled-system';
import { cva, styled } from '../styled-system';
import { getAvatarBg } from './getAvatarBg';
import { flexCenter } from '../utils/styles';

const getAvatarShape = (radii: string) => ({
  borderRadius: radii === '$round' ? 'round' : '1',
});

const avatarVariants = cva({
  base: {
    ...flexCenter,
    color: 'onPrimary.high',
    fontFamily: 'sans',
    aspectRatio: '1',
    fontWeight: 600,
    fontSize: '9',
  },
  variants: {
    shape: {
      circle: getAvatarShape('$round'),
      square: getAvatarShape('$1'),
    },
    size: {
      small: {
        height: '16',
        fontSize: '6',
        '& *': {
          fontSize: '6 !important',
        },
      },
      medium: {
        height: '18',
        fontSize: '10',
        '& *': {
          fontSize: '10 !important',
        },
      },
      large: {
        height: '20',
        fontSize: '12',
        '& *': {
          fontSize: '12 !important',
        },
      },
    },
  },
  defaultVariants: {
    shape: 'circle',
  },
});

export const StyledAvatar = styled('div', avatarVariants);

export type AvatarProps = HTMLStyledProps<typeof StyledAvatar> & {
  name: string;
};

export const Avatar: React.FC<AvatarProps> = ({ name, style, ...props }) => {
  const info = getAvatarBg(name);
  let { color } = info;
  if (!name) {
    color = '#7E47EB';
  }
  return (
    <StyledAvatar style={{ backgroundColor: color, ...style }} {...props}>
      {info.initials || <PersonIcon height={40} width={40} />}
    </StyledAvatar>
  );
};

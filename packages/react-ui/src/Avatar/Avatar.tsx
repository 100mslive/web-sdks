import { styled } from '../stitches.config';
import { flexCenter } from '../utils/styles';

const getAvatarSize = (size: string, textSize: string) => ({
  width: size,
  height: size,
  fontSize: textSize,
});

const getAvatarShape = (radii: string) => ({
  borderRadius: radii,
});

export const Avatar = styled('div', {
  ...flexCenter,
  width: '$4',
  height: '$4',
  fontWeight: '500',
  variants: {
    size: {
      xs: getAvatarSize('$3', '$xs'),
      sm: getAvatarSize('$5', '$sm'),
      md: getAvatarSize('$6', '$md'),
      lg: getAvatarSize('$7', '$lg'),
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

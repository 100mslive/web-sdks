import { styled } from '../Theme';
import { flexCenter } from '../utils/styles';

/**
 * @param base bg color
 * @param hover hover state bg color
 * @param active active state bg color
 * @returns CSS object based on the state
 */
const getButtonVariants = (base: string, hover: string, active: string) => ({
  bg: base,
  c: '$white',
  '&[disabled]': {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  '&:not([disabled]):hover': {
    bg: hover,
  },
  '&:not([disabled]):active': {
    bg: active,
  },
});

export const Button = styled('button', {
  ...flexCenter,
  fontFamily: '$sans',
  outline: 'none',
  border: 'none',
  fs: '$md',
  r: '$1',
  backgroundColor: '$brandMain',
  fontWeight: '500',
  p: '$4 $8',
  '&:focus': {
    outline: 'none',
  },
  '&:not([disabled]):focus-visible': {
    boxShadow: '0 0 0 3px $colors$brandMain',
  },
  transition: 'all 0.2s  ease',
  variants: {
    variant: {
      standard: getButtonVariants('$grayDark', '$grayDefault', '$grayDefault'),
      danger: getButtonVariants('$error', '$errorTint', '$errorTint'),
      primary: getButtonVariants('$brandMain', '$brandTint', '$brandTint'),
    },
    icon: {
      true: {
        gap: '$4',
      },
    },
  },
  defaultVariants: {
    variant: 'primary',
  },
});

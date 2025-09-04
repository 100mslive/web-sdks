import type { HTMLStyledProps } from '../styled-system';
import { styled } from '../styled-system';
import { flexCenter } from '../utils/styles';

const StyledIconButton = styled('button', {
  base: {
    ...flexCenter,
    alignItems: 'center',
    outline: 'none',
    border: 'none',
    padding: '2',
    borderRadius: '0',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: 'onSurface.high',
    '&:not([disabled]):focus-visible': {
      boxShadow: '0 0 0 3px {colors.primary.default}',
    },
    '&:not([disabled]):focus': {
      outline: 'none',
    },
    '@media (hover: hover)': {
      '&:not([disabled]):hover': {
        backgroundColor: 'onSurface.low',
      },
    },
    '&[disabled]': {
      opacity: 0.5,
      cursor: 'not-allowed',
      backgroundColor: 'secondary.dim',
      color: 'onPrimary.high',
    },
    '&:focus': {
      outline: 'none',
    },
  },
  variants: {
    active: {
      true: {
        '&:not([disabled]):hover': {
          backgroundColor: 'onSurface.low',
        },
      },
    },
  },
});

export type IconButtonProps = HTMLStyledProps<typeof StyledIconButton>;
export const IconButton = StyledIconButton;

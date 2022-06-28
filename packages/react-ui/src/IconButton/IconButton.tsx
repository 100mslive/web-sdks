import { styled } from '../Theme';
import { flexCenter } from '../utils/styles';

export const IconButton = styled('button', {
  ...flexCenter,
  width: '$13',
  height: '$13',
  outline: 'none',
  border: '1px solid $borderLight',
  padding: '$2',
  r: '$1',
  cursor: 'pointer',
  backgroundColor: 'transparent',
  color: '$textPrimary',
  '&:not([disabled]):focus-visible': {
    boxShadow: '0 0 0 3px $colors$brandDefault',
  },
  '&:not([disabled]):focus': {
    outline: 'none',
  },
  '&:not([disabled]):hover': {
    backgroundColor: '$iconHoverBg',
  },
  '&[disabled]': {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  '&:focus': {
    outline: 'none',
  },
  variants: {
    active: {
      false: {
        backgroundColor: '$iconBtn',
        color: '$textInvert',
        '&:not([disabled]):hover': {
          backgroundColor: '$iconBtn',
        },
        border: 'none',
      },
      true: {
        '&:not([disabled]):hover': {
          backgroundColor: '$iconHoverBg',
        },
      },
    },
  },
});

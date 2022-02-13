import { styled } from '../Theme';
import { flexCenter } from '../utils/styles';

export const IconButton = styled('button', {
  ...flexCenter,
  outline: 'none',
  border: 'none',
  padding: '$2',
  r: '$1',
  cursor: 'pointer',
  backgroundColor: 'transparent',
  color: '$textPrimary',
  '&:not([disabled]):focus-visible': {
    boxShadow: '0 0 0 3px $colors$brandTint',
  },
  '&:not([disabled]):focus': {
    outline: 'none',
  },
  '&:not([disabled]):hover': {
    backgroundColor: '$trans',
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
      },
      true: {
        '&:not([disabled]):hover': {
          backgroundColor: '$trans',
        },
      },
    },
  },
});

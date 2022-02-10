import { styled } from '../Theme/stitches.config';
import { flexCenter } from '../utils/styles';

export const IconButton = styled('button', {
  ...flexCenter,
  outline: 'none',
  border: 'none',
  padding: '$1',
  r: '$1',
  cursor: 'pointer',
  backgroundColor: 'transparent',
  color: '$fg',
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
        color: '$bg',
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

import { styled } from '../Theme';
import { flexCenter } from '../utils/styles';

export const IconButton = styled('button', {
  ...flexCenter,
  alignItems: 'center',
  outline: 'none',
  border: 'none',
  padding: '$2',
  r: '$0',
  cursor: 'pointer',
  backgroundColor: 'transparent',
  color: '$on_surface_high',
  '&:not([disabled]):focus-visible': {
    boxShadow: '0 0 0 3px $colors$primary_default',
  },
  '&:not([disabled]):focus': {
    outline: 'none',
  },
  '@media (hover: hover)': {
    '&:not([disabled]):hover': {
      backgroundColor: '$on_surface_low',
    },
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
        backgroundColor: '$secondary_dim',
        color: '$on_primary_high',
        '&:not([disabled]):hover': {
          backgroundColor: '$secondary_default',
        },
      },
      true: {
        '&:not([disabled]):hover': {
          backgroundColor: '$on_surface_low',
        },
      },
    },
  },
});

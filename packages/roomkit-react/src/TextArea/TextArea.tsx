import { styled } from '../Theme';

export const TextArea = styled('textarea', {
  fontFamily: '$sans',
  lineHeight: 'inherit',
  backgroundColor: '$surface_default',
  borderRadius: '8px',
  outline: 'none',
  border: '1px solid $border_default',
  padding: '0.5rem 0.75rem',
  minHeight: '30px',
  color: '$on_surface_high',
  fontSize: '$md',
  '&:focus': {
    boxShadow: '0 0 0 1px $colors$primary_default',
    border: '1px solid transparent',
  },
  '&::placeholder': {
    color: '$on_surface_medium',
  },
  variants: {
    error: {
      true: {
        '&:focus': {
          boxShadow: '0 0 0 3px $colors$alert_error_default',
        },
      },
    },
  },
});

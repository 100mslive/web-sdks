import { styled } from '../styled-system';

export const TextArea = styled('textarea', {
  base: {
    fontFamily: 'sans',
    lineHeight: 'inherit',
    backgroundColor: 'surface.default',
    borderRadius: '8px',
    outline: 'none',
    border: '1px solid token(colors.border.default)',
    padding: '0.5rem 0.75rem',
    minHeight: '30px',
    color: 'onSurface.high',
    fontSize: 'md',
    '&:focus': {
      boxShadow: '0 0 0 1px token(colors.primary.default)',
      border: '1px solid transparent',
    },
    '&::placeholder': {
      color: 'onSurface.medium',
    },
  },
  variants: {
    error: {
      true: {
        '&:focus': {
          boxShadow: '0 0 0 3px token(colors.alert.error.default)',
        },
      },
    },
  },
});

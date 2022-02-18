import { styled } from '../Theme';

export const Input = styled('input', {
  backgroundColor: '$grayDark',
  borderRadius: '8px',
  outline: 'none',
  border: 'none',
  padding: '0.5rem 0.75rem',
  minHeight: '30px',
  color: '$textPrimary',
  fontSize: '$md',
  '&:focus': {
    boxShadow: '0 0 0 3px $colors$brandDefault',
  },
  variants: {
    error: {
      true: {
        '&:focus': {
          boxShadow: '0 0 0 3px $colors$error',
        },
      },
    },
  },
});

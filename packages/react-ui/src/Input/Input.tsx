import { styled } from '../Theme';

export const Input = styled('input', {
  height: '30px',
  backgroundColor: '$grayDark',
  borderRadius: '8px',
  outline: 'none',
  border: 'none',
  padding: '5px 10px',
  color: '$textPrimary',
  fontSize: '$md',
  '&:focus': {
    boxShadow: '0 0 0 3px $colors$brandDefault',
  },
  marginBottom: '20px',
  variants: {
    error: {
      true: {
        '&:focus': {
          boxShadow: '0 0 0 3px $colors$error',
        },
      },
    },
    variant: {
      compact: {
        width: '240px',
        height: '36px',
      },
    },
  },
});

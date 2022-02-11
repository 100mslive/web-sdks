import { styled } from '../Theme';

export const Text = styled('p', {
  fontFamily: '$sans',
  fontWeight: 500,
  margin: 0,
  color: '$textPrimary',
  variants: {
    variant: {
      'heading-lg': {
        fontWeight: 600,
        fontSize: '25px',
        lineHeight: '32px',
      },
      'heading-md': {
        fontSize: '20px',
        lineHeight: '28px',
      },
      'heading-sm': {
        fontSize: '17px',
        lineHeight: '28px',
      },
      button: {
        fontSize: '17px',
        lineHeight: '24px',
      },
      body: {
        fontSize: '15px',
        lineHeight: '20px',
      },
      'body-sm': {
        fontSize: '13px',
        lineHeight: '16px',
      },
      'body-xs': {
        fontSize: '10px',
        lineHeight: '12px',
      },
    },
  },
  defaultVariants: {
    variant: 'body',
  },
});

import { styled } from '../Theme';

export const Text = styled('p', {
  fontFamily: '$sans',
  fontWeight: 500,
  margin: 0,
  color: '$textPrimary',
  variants: {
    variant: {
      h1: {
        fontWeight: '$semiBold',
        fontSize: '$h1',
        lineHeight: '$h1',
      },
      h2: {
        fontSize: '$h2',
        lineHeight: '$h2',
      },
      h3: {
        fontSize: '$h3',
        lineHeight: '$h3',
      },
      h4: {
        fontSize: '$h4',
        lineHeight: '$h4',
      },
      h5: {
        fontSize: '$h5',
        lineHeight: '$h5',
      },
      h6: {
        fontSize: '$h6',
        lineHeight: '$h6',
      },
      tiny: {
        fontSize: '$tiny',
        lineHeight: '$tiny',
      },
      xs: {
        fontSize: '$xs',
        lineHeight: '$xs',
      },
      sm: {
        fontSize: '$sm',
        lineHeight: '$sm',
      },
      md: {
        fontSize: '$md',
        lineHeight: '$md',
      },
    },
    inline: {
      true: {
        display: 'inline',
      },
    },
  },
  defaultVariants: {
    variant: 'md',
  },
});

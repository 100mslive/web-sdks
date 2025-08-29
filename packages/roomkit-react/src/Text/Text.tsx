import { styled } from '../Theme';

export const textVariants = {
  h1: {
    fontWeight: '$semiBold',
    letterSpacing: '-1.5px',
    fontSize: '$h1',
    lineHeight: '$h1',
    containerMd: {
      fontSize: '4.5rem',
      lineHeight: '4.75rem',
    },
  },
  h2: {
    fontSize: '$h2',
    lineHeight: '$h2',
    fontWeight: '$semiBold',
    letterSpacing: '-0.5px',
    containerMd: {
      fontSize: '3rem',
      lineHeight: '3.25rem',
    },
  },
  h3: {
    fontSize: '$h3',
    lineHeight: '$h3',
    fontWeight: '$semiBold',
    containerMd: {
      fontSize: '2.5rem',
      lineHeight: '2.75rem',
    },
  },
  h4: {
    fontSize: '$h4',
    lineHeight: '$h4',
    fontWeight: '$semiBold',
    letterSpacing: '0.25px',
    containerMd: {
      fontSize: '1.75rem',
      lineHeight: '2rem',
    },
  },
  h5: {
    fontSize: '$h5',
    lineHeight: '$h5',
    fontWeight: '$semiBold',
    containerMd: {
      fontSize: '1.5rem',
      lineHeight: '1.75rem',
    },
  },
  h6: {
    fontSize: '$h6',
    lineHeight: '$h6',
    fontWeight: '$semiBold',
    letterSpacing: '0.15px',
    containerMd: {
      fontSize: '1.25rem',
      lineHeight: '1.5rem',
    },
  },
  sub1: {
    fontSize: '$md',
    lineHeight: '$h5',
    fontWeight: '$medium',
    letterSpacing: '0.15px',
  },
  sub2: {
    fontSize: '$sm',
    lineHeight: '$sm',
    fontWeight: '$medium',
    letterSpacing: '0.1px',
  },
  body1: {
    fontSize: '$md',
    lineHeight: '$h6',
    fontWeight: '$medium',
    letterSpacing: '0.1px',
  },
  body2: {
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    fontWeight: '$medium',
    letterSpacing: '0.25px',
  },
  button: {
    fontSize: '1rem',
    lineHeight: '1.5rem',
    fontWeight: '$semiBold',
    letterSpacing: '0.5px',
  },
  caption: {
    fontSize: '0.75rem',
    lineHeight: '1rem',
    letterSpacing: '0.4px',
    fontWeight: '$regular',
  },
  overline: {
    fontSize: '0.625rem',
    lineHeight: '1rem',
    letterSpacing: '1.5px',
    fontWeight: '$medium',
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
  lg: {
    fontSize: '$lg',
    lineHeight: '$md',
    fontWeight: '$semiBold',
    letterSpacing: '0.15px',
  },
};

export const Text = styled('p', {
  fontFamily: '$sans',
  fontWeight: '$regular',
  margin: 0,
  color: '$on_surface_high',
  variants: {
    variant: textVariants,
    color: {
      white: {
        color: '$on_surface_high',
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

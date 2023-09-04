import { styled } from '../Theme';

const Root = styled('div', {
  height: '2rem',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  '& > * + *': {
    marginRight: '0',
    marginLeft: '0.5rem',
  },
});

const Chevron = styled('button', {
  color: '$on_surface_high',
  '&:focus': {
    outline: 'none',
  },
  '&[disabled]': {
    color: '$on_surface_low',
    cursor: 'not-allowed',
  },
  backgroundColor: 'transparent',
  display: 'flex',
});

const Dots = styled('div', {
  display: 'flex',
  alignItems: 'center',
  gap: '$6',
  '& > * + *': {
    marginRight: '0',
    marginLeft: '0',
  },
});

const Dot = styled('button', {
  '&:focus': {
    outline: 'none',
  },
  borderRadius: '9999px',
  backgroundColor: '$on_surface_low',
  padding: '$2',
  border: 'none',
  cursor: 'pointer',
  variants: {
    active: {
      true: {
        backgroundColor: '$on_surface_high',
      },
    },
    size: {
      large: {
        width: '0.5rem',
        height: '0.5rem',
      },
      medium: {
        width: '0.438rem',
        height: '0.438rem',
      },
      small: {
        width: '0.375rem',
        height: '0.375rem',
      },
    },
  },
  defaultVariants: {
    size: 'large',
  },
});

interface PaginationType {
  Root: typeof Root;
  Chevron: typeof Chevron;
  Dots: typeof Dots;
  Dot: typeof Dot;
}

export const StyledPagination: PaginationType = {
  Root,
  Chevron,
  Dots,
  Dot,
};

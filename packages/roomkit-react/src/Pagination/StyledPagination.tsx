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
  border: 'none',
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
  '& > * + *': {
    marginRight: '0',
    marginLeft: '0.5rem',
  },
});

const Dot = styled('button', {
  '&:focus': {
    outline: 'none',
  },
  borderRadius: '9999px',
  width: '0.5rem',
  height: '0.5rem',
  backgroundColor: '$on_surface_low',
  padding: '0px',
  border: 'none',
  cursor: 'pointer',
  variants: {
    active: {
      true: {
        backgroundColor: '$on_surface_high',
      },
    },
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

import { styled } from '../Theme';

const Root = styled('div', {
  height: '2rem',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  gap: '$6',
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
  transition: 'all .2s',
});

const Dot = styled('button', {
  '&:focus': {
    outline: 'none',
  },
  borderRadius: '9999px',
  width: '$4',
  height: '$4',
  flexShrink: 0,
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

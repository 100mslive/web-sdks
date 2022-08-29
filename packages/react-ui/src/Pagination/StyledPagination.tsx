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
  color: '$textPrimary',
  '&:focus': {
    outline: 'none',
  },
  '&[disabled]': {
    color: '$grayDefault',
    cursor: 'not-allowed',
  },
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
  backgroundColor: '$textDisabled',
  padding: '0px',
  border: 'none',
  cursor: 'pointer',
  variants: {
    active: {
      true: {
        backgroundColor: '$textPrimary',
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

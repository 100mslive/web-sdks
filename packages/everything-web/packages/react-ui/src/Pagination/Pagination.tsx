import { styled } from '../stitches.config';

const Root = styled('div', {
    height: '2rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    '& > * + *': {
        marginRight: '0',
        marginLeft: '0.5rem'
    }
});

const Chevron = styled('button', {
    '&[disabled]': {
        cursor: 'not-allowed',
        color: '$grey4'
    }
});

const Dots = styled('div', {
    display: 'flex',
    alignItems: 'center',
    '& > * + *': {
        marginRight: '0',
        marginLeft: '0.5rem'
    }
});

const Dot = styled('button', {
    borderRadius: '9999px',
    width: '0.5rem',
    height: '0.5rem',
    backgroundColor: '$grey3',
    variants: {
        active: {
            true: {
                backgroundColor: '$grey7'
            }
        }
    }
});

interface PaginationType {
    Root: typeof Root;
    Chevron: typeof Chevron;
    Dots: typeof Dots;
    Dot: typeof Dot;
}

export const Pagination: PaginationType = {
    Root,
    Chevron,
    Dots,
    Dot
};

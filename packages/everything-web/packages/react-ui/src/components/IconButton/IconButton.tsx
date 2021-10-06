import { styled } from '../../../stitches.config';

export const IconButton = styled('button', {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: '$sans',
    outline: 'none',
    border: 'none',
    padding: '8px',
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: 'White',
    '&:hover': {
        backgroundColor: '$grey2'
    },
    '&:focus': {
        boxShadow: '0 0 0 3px $colors$brandTint'
    },
    variants: {
        active: {
            true: {
                backgroundColor: 'White',
                color: 'Black'
            }
        }
    }
});

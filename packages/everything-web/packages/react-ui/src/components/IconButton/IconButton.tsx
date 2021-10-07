import { styled } from '../../../stitches.config';

export const IconButton = styled('button', {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: '$sans',
    outline: 'none',
    border: 'none',
    padding: '4px',
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: 'White',
    '&:focus': {
        boxShadow: '0 0 0 3px $colors$brandTint'
    },
    variants: {
        active: {
            false: {
                backgroundColor: 'White',
                color: 'Black'
            },
            true: {
                '&:hover': {
                    backgroundColor: '$grey2'
                }
            }
        }
    }
});

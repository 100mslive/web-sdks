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
    '&:focus-visible': {
        boxShadow: '0 0 0 3px $colors$brandTint'
    },
    '&:focus': {
        outline: 'none'
    },
    '&:hover': {
        backgroundColor: '$trans'
    },
    variants: {
        active: {
            true: {
                backgroundColor: 'White',
                color: 'Black',
                '&:hover': {
                    backgroundColor: 'White'
                }
            },
            false: {
                '&:hover': {
                    backgroundColor: '$trans'
                }
            }
        }
    }
});

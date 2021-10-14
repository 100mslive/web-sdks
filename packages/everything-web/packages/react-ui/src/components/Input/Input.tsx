import { styled } from '../../../stitches.config';

export const Input = styled('input', {
    height: '36px',
    backgroundColor: '$grey2',
    borderRadius: '8px',
    outline: 'none',
    border: 'none',
    padding: '5px 10px',
    color: 'white',
    fontSize: '16px',
    '&:focus': {
        boxShadow: '0 0 0 3px $colors$brandTint'
    },
    marginBottom: '20px',
    variants: {
        error: {
            true: {
                '&:focus': {
                    boxShadow: '0 0 0 3px $colors$redMain'
                }
            }
        },
        variant: {
            compact: {
                width: '240px',
                height: '36px'
            }
        }
    }
});

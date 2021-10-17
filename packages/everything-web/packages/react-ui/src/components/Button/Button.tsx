import { styled } from '../../../stitches.config';

export const Button = styled('button', {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: '$sans',
    outline: 'none',
    border: 'none',
    fontSize: '16px',
    fontWeight: '500',
    lineHeight: '24px',
    padding: '8px 12px',
    '&:focus': {
        outline: 'none'
    },
    variants: {
        variant: {
            standard: {
                color: '$white',

                backgroundColor: '$grey2',
                borderRadius: '8px',
                '&:hover': {
                    backgroundColor: '$grey3'
                },
                '&:focus-visible': {
                    boxShadow: '0 0 0 3px $colors$brandTint'
                }
            },
            danger: {
                color: '$white',

                backgroundColor: '$redMain',
                borderRadius: '8px',
                '&:hover': {
                    backgroundColor: '$redTint'
                },
                '&:focus-visible': {
                    boxShadow: '0 0 0 3px $colors$brandTint'
                }
            },
            primary: {
                color: '$white',

                backgroundColor: '$brandMain',
                borderRadius: '8px',
                '&:hover': {
                    backgroundColor: '$brandTint'
                },
                '&:focus-visible': {
                    boxShadow: '0 0 0 3px $colors$brandTint'
                }
            }
        },
        disabled: {
            true: {
                opacity: 0.2,
                cursor: 'not-allowed'
            }
        }
    },
    defaultVariants: {
        variant: 'primary'
    }
});

import { VariantProps } from '@stitches/react';
import React from 'react';
import { styled } from '../../../stitches.config';

export const ButtonRoot = styled('button', {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: '$sans',
    outline: 'none',
    border: 'none',
    fontSize: '16px',
    fontWeight: '500',
    lineHeight: '24px',
    variants: {
        variant: {
            standard: {
                color: '$white',
                padding: '10px 16px',
                backgroundColor: '$grey2',
                borderRadius: '8px',
                '&:hover': {
                    backgroundColor: '$grey3'
                },
                '&:focus': {
                    boxShadow: '0 0 0 3px $colors$brandTint'
                }
            },
            danger: {
                color: '$white',
                padding: '10px 16px',
                backgroundColor: '$redMain',
                borderRadius: '8px',
                '&:hover': {
                    backgroundColor: '$redTint'
                },
                '&:focus': {
                    boxShadow: '0 0 0 3px $colors$brandTint'
                }
            },
            primary: {
                color: '$white',
                padding: '10px 16px',
                backgroundColor: '$brandMain',
                borderRadius: '8px',
                '&:hover': {
                    backgroundColor: '$brandTint'
                },
                '&:focus': {
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

export type ButtonProps = VariantProps<typeof ButtonRoot>;

export const Button: React.FC<ButtonProps> = ({ variant, disabled, ...props }) => (
    <ButtonRoot variant={variant} {...props}>
        {props.children}
    </ButtonRoot>
);

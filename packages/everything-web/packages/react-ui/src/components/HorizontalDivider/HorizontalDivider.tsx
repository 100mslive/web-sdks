import { styled } from '../../../stitches.config';

export const HorizontalDivider = styled('span', {
    height: '1px',
    width: '100%',
    backgroundColor: '$grey2',
    display: 'block',
    variants: {
        space: {
            1: {
                margin: '0.25rem 0'
            },
            2: {
                margin: '0.5rem 0'
            },
            3: {
                margin: '0.75rem 0'
            },
            4: {
                margin: '1rem 0'
            }
        }
    },
    defaultVariants: {
        space: 2
    }
});

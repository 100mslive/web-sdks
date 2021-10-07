import { styled } from '../../../stitches.config';

export const VerticalDivider = styled('span', {
    height: '25px',
    width: '1px',
    backgroundColor: '$grey2',
    variants: {
        space: {
            1: {
                margin: '0 0.25rem'
            },
            2: {
                margin: '0 0.5rem'
            },
            3: {
                margin: '0 0.75rem'
            },
            4: {
                margin: '0 1rem'
            }
        }
    },
    defaultVariants: {
        space: 2
    }
});

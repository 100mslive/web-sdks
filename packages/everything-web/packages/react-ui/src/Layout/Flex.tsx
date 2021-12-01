import { styled } from '../stitches.config';

export const Flex = styled('div', {
    display: 'flex',
    variants: {
        justify: {
            start: {
                justifyContent: 'flex-start'
            },
            end: {
                justifyContent: 'flex-end'
            },
            center: {
                justifyContent: 'center'
            },
            between: {
                justifyContent: 'space-between'
            },
            around: {
                justifyContent: 'space-around'
            },
            evenly: {
                justifyContent: 'space-evenly'
            }
        },
        align: {
            start: {
                alignItems: 'flex-start'
            },
            end: {
                alignItems: 'flex-end'
            },
            center: {
                alignItems: 'center'
            },
            baseline: {
                alignItems: 'baseline'
            },
            strech: {
                alignItems: 'stretch'
            }
        }
    }
});

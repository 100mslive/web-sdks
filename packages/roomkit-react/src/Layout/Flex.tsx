import type { HTMLStyledProps } from '../styled-system';
import { styled } from '../styled-system';

/**
 * @see https://tailwindcss.com/docs/space
 */
const gapStyles = (num: number) => {
  return {
    '& > * + *': {
      marginRight: '0',
      marginLeft: `${0.25 * num}rem`,
    },
  };
};

const StyledFlex = styled('div', {
  base: {
    display: 'flex',
  },
  variants: {
    justify: {
      start: {
        justifyContent: 'flex-start',
      },
      end: {
        justifyContent: 'flex-end',
      },
      center: {
        justifyContent: 'center',
      },
      between: {
        justifyContent: 'space-between',
      },
      around: {
        justifyContent: 'space-around',
      },
      evenly: {
        justifyContent: 'space-evenly',
      },
    },
    align: {
      start: {
        alignItems: 'flex-start',
      },
      end: {
        alignItems: 'flex-end',
      },
      center: {
        alignItems: 'center',
      },
      baseline: {
        alignItems: 'baseline',
      },
      stretch: {
        alignItems: 'stretch',
      },
    },
    direction: {
      row: {
        flexDirection: 'row',
      },
      column: {
        flexDirection: 'column',
      },
      rowReverse: {
        flexDirection: 'row-reverse',
      },
      columnReverse: {
        flexDirection: 'column-reverse',
      },
    },
    gap: {
      1: gapStyles(1),
      2: gapStyles(2),
      3: gapStyles(3),
      4: gapStyles(4),
    },
  },
});

export type FlexProps = HTMLStyledProps<typeof StyledFlex>;
export const Flex = StyledFlex;

import { styled } from '../Theme';

/**
 * @see https://tailwindcss.com/docs/space
 */
const gapStyles = (value: number) => {
  return {
    '& > * + *': {
      marginRight: '0',
      marginLeft: `${0.25 * value}rem`,
    },
  };
};

export const Flex = styled('div', {
  display: 'flex',
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
      strech: {
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

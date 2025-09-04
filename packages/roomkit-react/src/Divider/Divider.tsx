import type { HTMLStyledProps } from '../styled-system';
import { styled } from '../styled-system';

const getVerticalSpace = (space: string) => ({
  marginLeft: space,
  marginRight: space,
});
const getHorizontalSpace = (space: string) => ({
  marginTop: space,
  marginBottom: space,
});

const StyledVerticalDivider = styled('span', {
  base: {
    height: '25px',
    width: '1px',
    backgroundColor: 'border.bright',
  },
  variants: {
    space: {
      1: getVerticalSpace('1'),
      2: getVerticalSpace('2'),
      3: getVerticalSpace('3'),
      4: getVerticalSpace('4'),
    },
  },
  defaultVariants: {
    space: 1,
  },
});

const StyledHorizontalDivider = styled('span', {
  base: {
    height: '1px',
    width: '100%',
    display: 'block',
    backgroundColor: 'border.bright',
  },
  variants: {
    space: {
      1: getHorizontalSpace('1'),
      2: getHorizontalSpace('2'),
      3: getHorizontalSpace('3'),
      4: getHorizontalSpace('4'),
    },
  },
  defaultVariants: {
    space: 1,
  },
});

export type VerticalDividerProps = HTMLStyledProps<typeof StyledVerticalDivider>;
export type HorizontalDividerProps = HTMLStyledProps<typeof StyledHorizontalDivider>;

export const VerticalDivider = StyledVerticalDivider;
export const HorizontalDivider = StyledHorizontalDivider;

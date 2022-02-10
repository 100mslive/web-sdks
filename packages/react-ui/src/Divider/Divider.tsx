import { styled } from '../Theme/stitches.config';

const getVerticalSpace = (space: string) => ({
  marginLeft: space,
  marginRight: space,
});
const getHorizontalSpace = (space: string) => ({
  marginTop: space,
  marginBottom: space,
});

export const VerticalDivider = styled('span', {
  height: '25px',
  width: '1px',
  backgroundColor: '$grey2',
  variants: {
    space: {
      1: getVerticalSpace('$1'),
      2: getVerticalSpace('$1'),
      3: getVerticalSpace('$3'),
      4: getVerticalSpace('$4'),
    },
  },
  defaultVariants: {
    space: 2,
  },
});

export const HorizontalDivider = styled('span', {
  height: '1px',
  width: '100%',
  display: 'block',
  backgroundColor: '$grey2',
  variants: {
    space: {
      1: getHorizontalSpace('$1'),
      2: getHorizontalSpace('$1'),
      3: getHorizontalSpace('$3'),
      4: getHorizontalSpace('$4'),
    },
  },
  defaultVariants: {
    space: 2,
  },
});

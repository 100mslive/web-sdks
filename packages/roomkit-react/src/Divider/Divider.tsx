import { styled } from '../Theme';

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
  backgroundColor: '$border_bright',
  variants: {
    space: {
      1: getVerticalSpace('$1'),
      2: getVerticalSpace('$2'),
      3: getVerticalSpace('$3'),
      4: getVerticalSpace('$4'),
    },
  },
  defaultVariants: {
    space: 1,
  },
});

export const HorizontalDivider = styled('span', {
  height: '1px',
  width: '100%',
  display: 'block',
  backgroundColor: '$border_bright',
  variants: {
    space: {
      1: getHorizontalSpace('$1'),
      2: getHorizontalSpace('$2'),
      3: getHorizontalSpace('$3'),
      4: getHorizontalSpace('$4'),
    },
  },
  defaultVariants: {
    space: 1,
  },
});

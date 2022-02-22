import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { styled } from '../Theme';

const CheckboxRoot = styled(CheckboxPrimitive.Root, {
  all: 'unset',
  border: '1px solid $brandDefault',
  backgroundColor: '$white',
  width: '$8',
  height: '$8',
  borderRadius: '$0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: 'none',
  outline: 'none',
  cursor: 'pointer',
  '&:focus': {
    boxShadow: 'none',
    outline: 'none',
  },
  '&[data-state="checked"]': {
    backgroundColor: '$brandDefault',
  },
});

const CheckboxIndicator = styled(CheckboxPrimitive.Indicator, {
  color: '$white',
});

export const Checkbox = {
  Root: CheckboxRoot,
  Indicator: CheckboxIndicator,
};

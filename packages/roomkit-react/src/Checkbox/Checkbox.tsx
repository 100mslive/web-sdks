import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { styled } from '../Theme';

const CheckboxRoot = styled(CheckboxPrimitive.Root, {
  all: 'unset',
  border: '1px solid $primary_default',
  backgroundColor: '$on_primary_high',
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
    backgroundColor: '$primary_default',
  },
});

const CheckboxIndicator = styled(CheckboxPrimitive.Indicator, {
  color: '$on_primary_high',
  // center check svg within button box
  lineHeight: 0,
});

export const Checkbox = {
  Root: CheckboxRoot,
  Indicator: CheckboxIndicator,
};

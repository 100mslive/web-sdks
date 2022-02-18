import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { styled } from '../Theme';

export const Checkbox = styled(CheckboxPrimitive.Root, {
  all: 'unset',
  backgroundColor: '$white',
  width: '$8',
  height: '$8',
  borderRadius: '$0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: 'none',
  outline: 'none',
  '&:focus': {
    boxShadow: 'none',
    outline: 'none',
  },
});

export const CheckboxIndicator = styled(CheckboxPrimitive.Indicator, {
  color: '$brandDefault',
});

export const CheckboxLabel = styled('label', {
  fontSize: '$md',
  color: '$textPrimary',
  ml: '$4',
});

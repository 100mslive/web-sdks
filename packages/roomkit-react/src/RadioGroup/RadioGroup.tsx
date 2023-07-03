import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { styled } from '../Theme';

const RadioGroupRoot = styled(RadioGroupPrimitive.Root, {
  display: 'flex',
  alignItems: 'center',
});

const RadioGroupItem = styled(RadioGroupPrimitive.Item, {
  bg: '$white',
  width: '$8',
  height: '$8',
  border: '1px solid $brandDefault',
  cursor: 'pointer',
  borderRadius: '$round',
  '&:focus': {
    boxShadow: 'none',
    outline: 'none',
  },
  '&[data-state="checked"]': {
    borderWidth: '$space$2',
    p: '$1',
  },
});
const RadioGroupIndicator = styled(RadioGroupPrimitive.Indicator, {
  bg: '$brandDefault',
});

export const RadioGroup = {
  Root: RadioGroupRoot,
  Item: RadioGroupItem,
  Indicator: RadioGroupIndicator,
};

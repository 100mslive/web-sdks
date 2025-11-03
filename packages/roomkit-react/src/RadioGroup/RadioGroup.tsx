import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import { styled } from '../Theme';

const RadioGroupRoot = styled(RadioGroupPrimitive.Root, {
  display: 'flex',
  alignItems: 'center',
});

const RadioGroupItem = styled(RadioGroupPrimitive.Item, {
  bg: '$on_primary_high',
  width: '$8',
  height: '$8',
  border: '1px solid $primary_default',
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
  bg: '$primary_default',
});

export const RadioGroup = {
  Root: RadioGroupRoot,
  Item: RadioGroupItem,
  Indicator: RadioGroupIndicator,
};

import { Label as LabelPrimitive } from 'radix-ui';
import { styled } from '../Theme';

export const Label = styled(LabelPrimitive.Root, {
  fontFamily: '$sans',
  fontSize: '$md',
  color: '$on_primary_high',
});

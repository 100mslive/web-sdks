import * as LabelPrimitive from '@radix-ui/react-label';
import type { HTMLStyledProps } from '../styled-system';
import { styled } from '../styled-system';

const StyledLabel = styled(LabelPrimitive.Root, {
  base: {
    fontFamily: 'sans',
    fontSize: 'md',
    color: 'onPrimary.high',
  },
});

export type LabelProps = HTMLStyledProps<typeof StyledLabel>;
export const Label = StyledLabel;

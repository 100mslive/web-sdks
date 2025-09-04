import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { styled } from '../styled-system';

const RadioGroupRoot = styled(RadioGroupPrimitive.Root, {
  base: {
    display: 'flex',
    alignItems: 'center',
  },
});

const RadioGroupItem = styled(RadioGroupPrimitive.Item, {
  base: {
    backgroundColor: 'onPrimary.high',
    width: 'token(spacing.8)',
    height: 'token(spacing.8)',
    border: '1px solid token(colors.primary.default)',
    cursor: 'pointer',
    borderRadius: 'token(radii.round)',
    '&:focus': {
      boxShadow: 'none',
      outline: 'none',
    },
    '&[data-state="checked"]': {
      borderWidth: 'token(spacing.2)',
      padding: 'token(spacing.1)',
    },
  },
});

const RadioGroupIndicator = styled(RadioGroupPrimitive.Indicator, {
  base: {
    backgroundColor: 'primary.default',
  },
});

export const RadioGroup = {
  Root: RadioGroupRoot,
  Item: RadioGroupItem,
  Indicator: RadioGroupIndicator,
};

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { styled } from '../styled-system';

const CheckboxRoot = styled(CheckboxPrimitive.Root, {
  base: {
    all: 'unset',
    border: '1px solid token(colors.primary.default)',
    backgroundColor: 'onPrimary.high',
    width: 'token(spacing.8)',
    height: 'token(spacing.8)',
    borderRadius: 'token(radii.0)',
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
      backgroundColor: 'primary.default',
    },
  },
});

const CheckboxIndicator = styled(CheckboxPrimitive.Indicator, {
  base: {
    color: 'onPrimary.high',
    lineHeight: '0',
  },
});

export const Checkbox = {
  Root: CheckboxRoot,
  Indicator: CheckboxIndicator,
};

import React, { ComponentPropsWithRef, ForwardedRef, PropsWithChildren } from 'react';
import { Box, Flex } from '../Layout';
import { Loading } from '../Loading';
import { styled } from '../Theme';
import { flexCenter } from '../utils/styles';

/**
 * @param base bg color
 * @param hover hover state bg color
 * @param active active state bg color
 * @returns CSS object based on the state
 */

const getOutlinedVariants = (base: string, hover: string, active: string, disabled: string) => {
  return {
    bg: '$transparent',
    border: `solid $space$px ${base}`,
    c: '$textHighEmp',
    '&[disabled]': {
      c: '$textDisabledWhite',
      bg: '$transparent',
      border: `solid $space$px ${disabled}`,
      cursor: 'not-allowed',
    },
    '&:not([disabled]):hover': {
      border: `solid $space$px ${hover}`,
      bg: '$transparent',
    },
    '&:not([disabled]):active': {
      border: `solid $space$px ${active}`,
      bg: '$transparent',
    },
  };
};

const getButtonVariants = (base: string, hover: string, active: string, disabled: string) => {
  return {
    bg: base,
    c: '$textHighEmp',
    '&[disabled]': {
      c: '$textDisabledWhite',
      cursor: 'not-allowed',
      bg: disabled,
    },
    '&:not([disabled]):hover': {
      bg: hover,
    },
    '&:not([disabled]):active': {
      bg: active,
    },
  };
};

const StyledButton = styled('button', {
  ...flexCenter,
  fontFamily: '$sans',
  position: 'relative',
  outline: 'none',
  border: 'none',
  fs: '$md',
  r: '$1',
  backgroundColor: '$primaryDefault',
  fontWeight: '500',
  whiteSpace: 'nowrap',
  p: '$4 $8',
  '&:focus': {
    outline: 'none',
  },
  '&:not([disabled]):focus-visible': {
    boxShadow: '0 0 0 3px $colors$primaryDefault',
  },
  transition: 'all 0.2s  ease',
  compoundVariants: [
    {
      variant: 'standard',
      outlined: true,
      css: getOutlinedVariants('$secondaryDefault', '$secondaryLight', '$secondaryDark', '$secondaryDisabled'),
    },
    {
      variant: 'danger',
      outlined: true,
      css: getOutlinedVariants('$errorDefault', '$errorLight', '$errorDark', '$errorDisabled'),
    },
    {
      variant: 'primary',
      outlined: true,
      css: getOutlinedVariants('$primaryDefault', '$primaryLight', '$primaryDark', '$primaryDisabled'),
    },
  ],
  variants: {
    variant: {
      standard: getButtonVariants('$secondaryDefault', '$secondaryLight', '$secondaryDark', '$secondaryDisabled'),
      danger: getButtonVariants('$errorDefault', '$errorLight', '$errorDark', '$errorDisabled'),
      primary: getButtonVariants('$primaryDefault', '$primaryLight', '$primaryDark', '$primaryDisabled'),
    },
    outlined: {
      true: {},
    },
    icon: {
      true: {
        gap: '$4',
      },
    },
    loading: {
      true: {},
    },
  },
  defaultVariants: {
    variant: 'primary',
  },
});

export interface ButtonLoadingProps {
  children?: React.ReactNode;
  loading: boolean;
}

export type Ref = HTMLButtonElement;

export const Button = React.forwardRef<
  Ref,
  PropsWithChildren<{ loading: boolean } & ComponentPropsWithRef<typeof StyledButton>>
>(({ children, loading, ...buttonProps }, ref) => {
  return (
    <StyledButton {...buttonProps} loading={loading} ref={ref}>
      {loading ? <Loading /> : <>{children}</>}
    </StyledButton>
  );
});

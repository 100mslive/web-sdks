import React, { ComponentPropsWithRef, PropsWithChildren } from 'react';
import { Flex } from '../Layout';
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
      c: '$textAccentDisabled',
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
    c: '$textAccentHigh',
    '&[disabled]': {
      c: '$textAccentDisabled',
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
      true: {},
    },
  },
  defaultVariants: {
    variant: 'primary',
  },
});

export const Button = React.forwardRef<
  HTMLButtonElement,
  PropsWithChildren<{ loading?: boolean } & ComponentPropsWithRef<typeof StyledButton>>
>(({ children, loading = false, icon, ...buttonProps }, ref) => {
  return (
    <StyledButton {...buttonProps} ref={ref}>
      <>
        {loading && (
          <Flex align="center" justify="center" css={{ w: '100%', position: 'absolute', left: '0' }}>
            <Loading />
          </Flex>
        )}
        <Flex
          align="center"
          justify="center"
          css={{ visibility: loading ? 'hidden' : 'visible', gap: icon ? '$4' : '0' }}
        >
          {children}
        </Flex>
      </>
    </StyledButton>
  );
});

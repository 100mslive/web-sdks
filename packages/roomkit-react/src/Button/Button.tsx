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

const getOutlinedVariants = (
  base: string,
  hover: string,
  active: string,
  disabled: string,
  text: string,
  textDisabled: string,
  textHover?: string,
) => {
  return {
    bg: 'transparent',
    border: `solid $space$px $colors${base}`,
    c: text,
    '&[disabled]': {
      c: textDisabled,
      bg: 'transparent',
      border: `solid $space$px $colors${disabled}`,
      cursor: 'not-allowed',
    },
    '&:not([disabled]):hover': {
      c: textHover,
      border: `solid $space$px $colors${hover}`,
      bg: 'transparent',
    },
    '&:not([disabled]):active': {
      border: `solid $space$px $colors${active}`,
      bg: 'transparent',
    },
    '&:not([disabled]):focus-visible': {
      boxShadow: `0 0 0 3px $colors${base}`,
    },
  };
};

const getButtonVariants = (
  base: string,
  hover: string,
  active: string,
  disabled: string,
  text: string,
  textDisabled: string,
  textHover?: string,
) => {
  return {
    bg: base,
    border: `1px solid ${base}`,
    c: text,
    '&[disabled]': {
      c: textDisabled,
      cursor: 'not-allowed',
      bg: disabled,
      border: `1px solid ${disabled}`,
    },
    '&:not([disabled]):hover': {
      c: textHover,
      bg: hover,
      border: `1px solid ${hover}`,
    },
    '&:not([disabled]):active': {
      bg: active,
      border: `1px solid ${active}`,
    },
    '&:not([disabled]):focus-visible': {
      boxShadow: `0 0 0 3px $colors${hover}`,
    },
  };
};

const StyledButton = styled('button', {
  ...flexCenter,
  cursor: 'pointer',
  fontFamily: '$sans',
  lineHeight: 'inherit',
  textTransform: 'none',
  position: 'relative',
  outline: 'none',
  border: 'none',
  fs: '$md',
  r: '$1',
  backgroundColor: '$primary_default',
  fontWeight: '500',
  whiteSpace: 'nowrap',
  p: '$4 $8',
  '-webkit-appearance': 'button',
  '&:focus': {
    outline: 'none',
  },
  '&:not([disabled]):focus-visible': {
    boxShadow: '0 0 0 3px $colors$primary_default',
  },
  transition: 'all 0.2s  ease',
  compoundVariants: [
    {
      variant: 'standard',
      outlined: true,
      css: getOutlinedVariants(
        '$secondary_default',
        '$secondary_bright',
        '$secondary_dim',
        '$secondary_disabled',
        '$on_surface_high',
        '$on_surface_low',
      ),
    },
    {
      variant: 'danger',
      outlined: true,
      css: getOutlinedVariants(
        '$alert_error_default',
        '$alert_error_bright',
        '$alert_error_dim',
        '$alert_error_brighter',
        '$on_surface_high',
        '$on_surface_low',
        '$on_surface_high',
      ),
    },
    {
      variant: 'primary',
      outlined: true,
      css: getOutlinedVariants(
        '$primary_default',
        '$primary_bright',
        '$primary_dim',
        '$primary_disabled',
        '$on_surface_high',
        '$on_surface_low',
      ),
    },
  ],
  variants: {
    variant: {
      standard: getButtonVariants(
        '$secondary_default',
        '$secondary_bright',
        '$secondary_dim',
        '$secondary_disabled',
        '$on_secondary_high',
        '$on_secondary_low',
      ),
      danger: getButtonVariants(
        '$alert_error_default',
        '$alert_error_bright',
        '$alert_error_dim',
        '$alert_error_dim',
        '$alert_error_brighter',
        '$on_primary_low',
        '$on_primary_high',
      ),
      primary: getButtonVariants(
        '$primary_default',
        '$primary_bright',
        '$primary_dim',
        '$primary_disabled',
        '$on_primary_high',
        '$on_primary_low',
      ),
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
          <Flex
            align="center"
            justify="center"
            css={{ w: '100%', position: 'absolute', left: '0', color: '$on_primary_low' }}
          >
            <Loading color="currentColor" />
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

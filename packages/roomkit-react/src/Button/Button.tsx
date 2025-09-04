import React, { PropsWithChildren } from 'react';
import { Flex } from '../Layout';
import { Loading } from '../Loading';
import type { HTMLStyledProps } from '../styled-system';
import { cva, styled } from '../styled-system';
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
    backgroundColor: 'transparent',
    border: `solid 1px {colors.${base.replace('$', '')}}`,
    color: `{colors.${text.replace('$', '')}}`,
    '&[disabled]': {
      color: `{colors.${textDisabled.replace('$', '')}}`,
      backgroundColor: 'transparent',
      border: `solid 1px {colors.${disabled.replace('$', '')}}`,
      cursor: 'not-allowed',
    },
    '&:not([disabled]):hover': {
      color: textHover ? `{colors.${textHover.replace('$', '')}}` : undefined,
      border: `solid 1px {colors.${hover.replace('$', '')}}`,
      backgroundColor: 'transparent',
    },
    '&:not([disabled]):active': {
      border: `solid 1px {colors.${active.replace('$', '')}}`,
      backgroundColor: 'transparent',
    },
    '&:not([disabled]):focus-visible': {
      boxShadow: `0 0 0 3px {colors.${base.replace('$', '')}}`,
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
    backgroundColor: `{colors.${base.replace('$', '')}}`,
    border: `1px solid {colors.${base.replace('$', '')}}`,
    color: `{colors.${text.replace('$', '')}}`,
    '&[disabled]': {
      color: `{colors.${textDisabled.replace('$', '')}}`,
      cursor: 'not-allowed',
      backgroundColor: `{colors.${disabled.replace('$', '')}}`,
      border: `1px solid {colors.${disabled.replace('$', '')}}`,
    },
    '&:not([disabled]):hover': {
      color: textHover ? `{colors.${textHover.replace('$', '')}}` : undefined,
      backgroundColor: `{colors.${hover.replace('$', '')}}`,
      border: `1px solid {colors.${hover.replace('$', '')}}`,
    },
    '&:not([disabled]):active': {
      backgroundColor: `{colors.${active.replace('$', '')}}`,
      border: `1px solid {colors.${active.replace('$', '')}}`,
    },
    '&:not([disabled]):focus-visible': {
      boxShadow: `0 0 0 3px {colors.${hover.replace('$', '')}}`,
    },
  };
};

const buttonStyles = cva({
  base: {
    ...flexCenter,
    cursor: 'pointer',
    fontFamily: 'sans',
    lineHeight: 'inherit',
    textTransform: 'none',
    position: 'relative',
    outline: 'none',
    border: 'none',
    fontSize: 'md',
    borderRadius: '1',
    backgroundColor: 'primary.default',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    padding: '4 8',
    WebkitAppearance: 'button',
    transition: 'all 0.2s ease',
    '&:focus': {
      outline: 'none',
    },
    '&:not([disabled]):focus-visible': {
      boxShadow: '0 0 0 3px {colors.primary.default}',
    },
  },
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
  defaultVariants: {
    variant: 'primary',
  },
});

const StyledButton = styled('button', buttonStyles);

export type ButtonProps = PropsWithChildren<{ loading?: boolean } & HTMLStyledProps<typeof StyledButton>>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, loading = false, icon, ...buttonProps }, ref) => {
    return (
      <StyledButton {...buttonProps} ref={ref}>
        <>
          {loading && (
            <Flex
              align="center"
              justify="center"
              style={{
                width: '100%',
                position: 'absolute',
                left: '0',
                color: 'var(--colors-on-primary-low)',
              }}
            >
              <Loading color="currentColor" />
            </Flex>
          )}
          <Flex
            align="center"
            justify="center"
            style={{
              visibility: loading ? 'hidden' : 'visible',
              gap: icon ? 'var(--spacing-4)' : '0',
            }}
          >
            {children}
          </Flex>
        </>
      </StyledButton>
    );
  },
);

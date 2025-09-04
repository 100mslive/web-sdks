import React, { ComponentProps, CSSProperties, PropsWithChildren, PropsWithRef } from 'react';
import { CopyIcon, EyeCloseIcon, EyeOpenIcon } from '@100mslive/react-icons';
import { Flex } from '../Layout';
import type { HTMLStyledProps } from '../styled-system';
import { styled } from '../styled-system';

const StyledInput = styled('input', {
  base: {
    fontFamily: 'sans',
    lineHeight: 'inherit',
    backgroundColor: 'surface.default',
    borderRadius: '8px',
    outline: 'none',
    border: '1px solid {colors.border.default}',
    padding: '0.5rem 0.75rem',
    minHeight: '30px',
    color: 'onSurface.high',
    fontSize: 'md',
    '&:disabled': {
      cursor: 'not-allowed',
    },
    '&:focus': {
      boxShadow: '0 0 0 1px {colors.primary.default}',
      border: '1px solid transparent',
    },
    '&::placeholder': {
      color: 'onSurface.medium',
    },
  },
  variants: {
    error: {
      true: {
        '&:focus': {
          boxShadow: '0 0 0 3px {colors.alert.error.default}',
        },
      },
    },
  },
});

const PasswordRoot = styled('div', {
  base: {
    width: '100%',
    position: 'relative',
    display: 'flex',
  },
});

export type InputProps = HTMLStyledProps<typeof StyledInput>;
export const Input = StyledInput;

const PasswordShowIcon: React.FC<ComponentProps<typeof Flex> & { showPassword?: boolean; style?: CSSProperties }> = ({
  showPassword,
  style,
  ...props
}) => {
  return (
    <Flex style={{ ...style }} {...props}>
      {showPassword ? <EyeOpenIcon /> : <EyeCloseIcon />}
    </Flex>
  );
};

const PasswordCopyIcon: React.FC<ComponentProps<typeof Flex> & { style?: CSSProperties }> = ({ style, ...props }) => {
  return (
    <Flex style={{ ...style }} {...props}>
      <CopyIcon />
    </Flex>
  );
};

const PasswordIcons = React.forwardRef<
  HTMLDivElement,
  PropsWithChildren<ComponentProps<typeof Flex> & { style?: CSSProperties }>
>(({ style, ...props }, ref) => {
  return (
    <Flex
      style={{
        position: 'absolute',
        top: 0,
        height: '100%',
        zIndex: 10,
        right: 'var(--spacing-4)',
        backgroundColor: 'var(--colors-surface-bright)',
        alignItems: 'center',
        ...style,
      }}
      ref={ref}
      {...props}
    >
      {props.children}
    </Flex>
  );
});

const ReactInput: React.FC<
  PropsWithRef<ComponentProps<typeof Input> & { showPassword?: boolean; style?: CSSProperties }>
> = React.forwardRef<
  HTMLInputElement,
  PropsWithRef<ComponentProps<typeof Input> & { showPassword?: boolean; style?: CSSProperties }>
>(({ showPassword = false, style, ...props }, ref) => {
  return (
    <Input
      style={{ flexGrow: 1, width: '100%', ...style }}
      type={showPassword ? 'text' : 'password'}
      {...props}
      ref={ref}
    />
  );
});

export const PasswordInput = {
  Root: PasswordRoot,
  Icons: PasswordIcons,
  Input: ReactInput,
  ShowIcon: PasswordShowIcon,
  CopyIcon: PasswordCopyIcon,
};

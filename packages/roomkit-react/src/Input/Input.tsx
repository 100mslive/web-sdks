import React, { ComponentProps, PropsWithChildren, PropsWithRef } from 'react';
import { CSS } from '@stitches/react';
import { CopyIcon, EyeCloseIcon, EyeOpenIcon } from '@100mslive/react-icons';
import { Flex } from '../Layout';
import { styled } from '../Theme';

export const Input = styled('input', {
  fontFamily: '$sans',
  backgroundColor: '$surfaceLight',
  borderRadius: '8px',
  outline: 'none',
  border: '1px solid $borderLight',
  padding: '0.5rem 0.75rem',
  minHeight: '30px',
  color: '$textPrimary',
  fontSize: '$md',
  '&:focus': {
    boxShadow: '0 0 0 1px $colors$borderAccent',
    border: '1px solid transparent',
  },
  '&::placeholder': {
    color: '$textDisabled',
  },
  variants: {
    error: {
      true: {
        '&:focus': {
          boxShadow: '0 0 0 3px $colors$error',
        },
      },
    },
  },
});

const PasswordRoot = styled('div', {
  w: '100%',
  position: 'relative',
  display: 'flex',
});

const PasswordShowIcon: React.FC<ComponentProps<typeof Flex> & { showPassword?: boolean; css?: CSS }> = ({
  showPassword,
  css,
  ...props
}) => {
  return (
    <Flex css={{ ...css }} {...props}>
      {showPassword ? <EyeOpenIcon /> : <EyeCloseIcon />}
    </Flex>
  );
};

const PasswordCopyIcon: React.FC<ComponentProps<typeof Flex & { css?: CSS }>> = ({ css, ...props }) => {
  return (
    <Flex css={{ ...css }} {...props}>
      <CopyIcon />
    </Flex>
  );
};

const PasswordIcons = React.forwardRef<HTMLDivElement, PropsWithChildren<ComponentProps<typeof Flex & { css?: CSS }>>>(
  ({ css, ...props }, ref) => {
    return (
      <Flex
        css={{
          position: 'absolute',
          top: 0,
          height: '100%',
          zIndex: 10,
          right: '$4',
          bg: '$surfaceLight',
          alignItems: 'center',
          ...css,
        }}
        ref={ref}
        {...props}
      >
        {props.children}
      </Flex>
    );
  },
);

const ReactInput: React.FC<PropsWithRef<ComponentProps<typeof Input> & { showPassword?: boolean; css?: CSS }>> =
  React.forwardRef<
    HTMLInputElement,
    PropsWithRef<ComponentProps<typeof Input> & { showPassword?: boolean; css?: CSS }>
  >(({ showPassword = false, css, ...props }, ref) => {
    return (
      <Input
        css={{ flexGrow: 1, width: '100%', ...css }}
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

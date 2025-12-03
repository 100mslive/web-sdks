import React, { ComponentProps, PropsWithChildren } from 'react';
import { CSS } from '@stitches/react';
import { CopyIcon, EyeCloseIcon, EyeOpenIcon } from '@100mslive/react-icons';
import { Flex } from '../Layout';
import { styled } from '../Theme';

export const Input = styled('input', {
  fontFamily: '$sans',
  lineHeight: 'inherit',
  backgroundColor: '$surface_default',
  borderRadius: '8px',
  outline: 'none',
  border: '1px solid $border_default',
  padding: '0.5rem 0.75rem',
  minHeight: '30px',
  color: '$on_surface_high',
  fontSize: '$md',
  '&:disabled': {
    cursor: 'not-allowed',
  },
  '&:focus': {
    boxShadow: '0 0 0 1px $colors$primary_default',
    border: '1px solid transparent',
  },
  '&::placeholder': {
    color: '$on_surface_medium',
  },
  variants: {
    error: {
      true: {
        '&:focus': {
          boxShadow: '0 0 0 3px $colors$alert_error_default',
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
          bg: '$surface_bright',
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

const ReactInput = React.forwardRef<
  HTMLInputElement,
  ComponentProps<typeof Input> & { showPassword?: boolean; css?: CSS }
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

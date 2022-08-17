import React, { PropsWithoutRef } from 'react';
import { styled } from '../Theme';
import { CSS } from '@stitches/react';
import { Flex } from '../Layout';
import { CopyIcon, EyeCloseIcon, EyeOpenIcon } from '@100mslive/react-icons';

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

const PasswordShowIcon = ({ showPassword, ...props }) => {
  return <Flex {...props}>{showPassword ? <EyeOpenIcon /> : <EyeCloseIcon />}</Flex>;
};

const PasswordCopyIcon = ({ ...props }) => {
  return (
    <Flex {...props}>
      <CopyIcon></CopyIcon>
    </Flex>
  );
};
const PasswordIcons = styled('div', {
  display: 'flex',
  position: 'absolute',
  top: 0,
  height: '100%',
  zIndex: 10,
  right: '$4',
  alignItems: 'center',
});

const ReactPasswordInput: React.FC<PropsWithoutRef<typeof Input & { showPassword: boolean; css?: CSS }>> = ({
  showPassword,
  css,
  ...props
}) => {
  return (
    <Input css={{ flexGrow: 1, width: '100%', ...css }} type={showPassword ? 'text' : 'password'} {...props}></Input>
  );
};

export const PasswordInput = {
  Root: PasswordRoot,
  Icons: PasswordIcons,
  Input: ReactPasswordInput,
  ShowIcon: PasswordShowIcon,
  CopyIcon: PasswordCopyIcon,
};

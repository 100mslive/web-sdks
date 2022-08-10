import React, { ComponentProps } from 'react';
import { styled } from '../Theme';
import { CSS } from '@stitches/react';
import { Box } from '../Layout';
import { EyeCloseIcon, EyeOpenIcon } from '@100mslive/react-icons';

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

export const PasswordInput = (props: ComponentProps<typeof Input>, iconStyles?: CSS) => {
  const [showPassword, setShowPassword] = React.useState(false);
  return (
    <Box css={{ w: 'inherit', position: 'relative' }}>
      <Input css={{ w: '-webkit-fill-available' }} type={showPassword ? 'text' : 'password'} {...props}></Input>
      <Box
        css={{ position: 'absolute', top: '25%', right: '$4', ...iconStyles }}
        onClick={() => setShowPassword(!showPassword)}
      >
        {showPassword ? <EyeOpenIcon></EyeOpenIcon> : <EyeCloseIcon></EyeCloseIcon>}
      </Box>
    </Box>
  );
};

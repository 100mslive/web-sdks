import React, { ComponentProps } from 'react';
import { styled } from '../Theme';
import { CSS } from '@stitches/react';
import { Box, Flex } from '../Layout';
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

export const PasswordInput = (
  props: ComponentProps<typeof Input>,
  hasPassword = true,
  hasCopy = true,
  onCopy?: () => void,
  passwordIconStyle?: CSS,
  copyIconStyle?: CSS,
  css?: CSS,
) => {
  const [showPassword, setShowPassword] = React.useState(false);
  return (
    <Box
      css={{
        w: '100%',
        display: 'block',
        position: 'relative',
      }}
    >
      <Input
        css={{ w: '-webkit-fill-available', display: 'block', ...css }}
        type={showPassword ? 'text' : 'password'}
        {...props}
      ></Input>
      <Flex css={{ position: 'absolute', top: '25%', zIndex: '10', right: '$4' }}>
        {hasPassword ? (
          <Box css={passwordIconStyle} onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOpenIcon /> : <EyeCloseIcon />}
          </Box>
        ) : null}
        {hasCopy ? (
          <Box css={copyIconStyle} onClick={onCopy}>
            <CopyIcon></CopyIcon>
          </Box>
        ) : null}
      </Flex>
    </Box>
  );
};

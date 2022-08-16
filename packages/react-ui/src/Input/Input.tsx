import React, { ComponentProps } from 'react';
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
    <Flex
      css={{
        w: '100%',
        position: 'relative',
      }}
    >
      <Input css={{ flexGrow: 1, width: '100%', ...css }} type={showPassword ? 'text' : 'password'} {...props}></Input>
      <Flex css={{ position: 'absolute', top: 0, height: '100%', zIndex: '10', right: '$4', alignItems: 'center' }}>
        {hasPassword ? (
          <Flex css={passwordIconStyle} onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOpenIcon /> : <EyeCloseIcon />}
          </Flex>
        ) : null}
        {hasCopy ? (
          <Flex css={copyIconStyle} onClick={onCopy}>
            <CopyIcon></CopyIcon>
          </Flex>
        ) : null}
      </Flex>
    </Flex>
  );
};

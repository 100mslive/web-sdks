import React from 'react';
import * as BaseSwitch from '@radix-ui/react-switch';
import { styled } from '../styled-system';

const SwitchRoot = styled(BaseSwitch.Root, {
  base: {
    all: 'unset',
    width: '30px',
    height: '14px',
    border: 'solid 1px token(colors.secondary.default)',
    borderRadius: 'token(radii.3)',
    padding: 'token(spacing.2)',
    position: 'relative',
    cursor: 'pointer',
    '&[data-state="checked"]': {
      backgroundColor: 'primary.default',
      border: 'solid 1px token(colors.primary.default)',
    },
    '&:focus': {
      outline: 'none',
    },
    '&[disabled]': {
      opacity: '0.5',
      cursor: 'not-allowed',
    },
  },
});

const SwitchThumb = styled(BaseSwitch.Thumb, {
  base: {
    display: 'block',
    top: '3px',
    position: 'absolute',
    width: 'token(spacing.md)',
    height: 'token(spacing.md)',
    backgroundColor: 'secondary.default',
    borderRadius: 'token(radii.round)',
    transition: 'right 500ms ease-in',
    left: 'token(spacing.2)',
    '&[data-state="checked"]': {
      left: 'unset',
      right: 'token(spacing.2)',
      backgroundColor: 'onPrimary.high',
    },
  },
});

type SwitchProps = React.ComponentProps<typeof SwitchRoot>;

export const Switch: React.FC<SwitchProps> = props => (
  <SwitchRoot {...props}>
    <SwitchThumb />
  </SwitchRoot>
);

Switch.displayName = 'Switch';

import React from 'react';
import * as BaseSwitch from '@radix-ui/react-switch';
import { styled } from '../Theme';

const SwitchRoot = styled(BaseSwitch.Root, {
  all: 'unset',
  width: '30px',
  height: '14px',
  border: 'solid $space$px $secondaryDefault',
  borderRadius: '$3',
  p: '$2',
  position: 'relative',
  cursor: 'pointer',
  '&[data-state="checked"]': {
    backgroundColor: '$primaryDefault',
    border: 'solid $space$px $primaryDefault',
  },
  '&:focus': {
    outline: 'none',
  },
  '&[disabled]': {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
});

const SwitchThumb = styled(BaseSwitch.Thumb, {
  display: 'block',
  top: '3px',
  position: 'absolute',
  width: '$md',
  height: '$md',
  backgroundColor: '$secondaryDefault',
  borderRadius: '$round',
  transition: 'right 500ms ease-in',
  left: '$2',
  '&[data-state="checked"]': {
    left: 'unset',
    right: '$2',
    backgroundColor: '$textAccentHigh',
  },
});

type SwitchProps = React.ComponentProps<typeof SwitchRoot>;

export const Switch: React.FC<SwitchProps> = props => (
  <SwitchRoot {...props}>
    <SwitchThumb />
  </SwitchRoot>
);

Switch.displayName = 'Switch';

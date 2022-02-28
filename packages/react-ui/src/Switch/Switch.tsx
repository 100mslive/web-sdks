import * as BaseSwitch from '@radix-ui/react-switch';
import React from 'react';
import { styled } from '../Theme';

const SwitchRoot = styled(BaseSwitch.Root, {
  all: 'unset',
  width: 34,
  height: 14,
  backgroundColor: '$bgSecondary',
  borderRadius: '9999px',
  position: 'relative',
  cursor: 'pointer',
  '&[data-state="checked"]': { backgroundColor: '$bgPrimary' },
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
  position: 'absolute',
  top: -3,
  left: -3,
  width: 20,
  height: 20,
  backgroundColor: '$grayDefault',
  borderRadius: '$round',
  transition: 'transform 100ms',
  transform: 'translateX(2px)',
  willChange: 'transform',
  '&[data-state="checked"]': { transform: 'translateX(18px)', backgroundColor: '$brandDefault' },
});

type SwitchProps = React.ComponentProps<typeof SwitchRoot>;

export const Switch: React.FC<SwitchProps> = props => (
  <SwitchRoot {...props}>
    <SwitchThumb />
  </SwitchRoot>
);

Switch.displayName = 'Switch';

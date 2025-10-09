import { ComponentProps, FC } from 'react';
import * as BaseSwitch from '@radix-ui/react-switch';
import { styled } from '../Theme';

const SwitchRoot = styled(BaseSwitch.Root, {
  all: 'unset',
  width: '30px',
  height: '14px',
  border: 'solid $space$px $secondary_default',
  borderRadius: '$3',
  p: '$2',
  position: 'relative',
  cursor: 'pointer',
  '&[data-state="checked"]': {
    backgroundColor: '$primary_default',
    border: 'solid $space$px $primary_default',
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
  backgroundColor: '$secondary_default',
  borderRadius: '$round',
  transition: 'right 500ms ease-in',
  left: '$2',
  '&[data-state="checked"]': {
    left: 'unset',
    right: '$2',
    backgroundColor: '$on_primary_high',
  },
});

type SwitchProps = ComponentProps<typeof SwitchRoot>;

export const Switch: FC<SwitchProps> = props => (
  <SwitchRoot {...props}>
    <SwitchThumb />
  </SwitchRoot>
);

Switch.displayName = 'Switch';

import React from 'react';
import { ChevronDownIcon } from '@100mslive/react-icons';
import { styled } from '../Theme';

const Root = styled('div', {
  color: '$textPrimary',
  display: 'inline-flex',
  position: 'relative',
  height: '40px',
  width: '250px',
  minWidth: '160px',
  outline: 'none',
  overflow: 'hidden',
  borderRadius: '8px',
  backgroundColor: '$grey2',
});

// TODO: replace these with tokens
const SelectRoot = styled('select', {
  fontSize: '$md',
  fontWeight: '500',
  appearance: 'none',
  color: '$textPrimary',
  width: '100%',
  paddingLeft: '12px',
  paddingRight: '30px',
  border: 'none',
  borderRadius: '8px',
  backgroundColor: 'transparent',
  '&:not([disabled]):focus-visible': {
    boxShadow: '0 0 0 3px $colors$brandStandard',
  },
  '&[disabled]': {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
});

const Arrow = styled('span', {
  color: '$grey4',
  width: '30px',
  height: '100%',
  position: 'absolute',
  right: 0,
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  transition: 'border .2s ease 0s',
});

interface Props {
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  value: string | number;
}

// * NOTE: this is temporary implementation waiting for radix-select
export const Select: React.FC<Props> = ({ onChange, value, children, ...props }) => (
  <Root>
    <Arrow>
      <ChevronDownIcon />
    </Arrow>
    <SelectRoot onChange={onChange} value={value} {...props}>
      {children}
    </SelectRoot>
  </Root>
);

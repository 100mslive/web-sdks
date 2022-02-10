import React from 'react';
import { ChevronDownIcon } from '@100mslive/react-icons';
import { styled } from '../Theme/stitches.config';

const Root = styled('div', {
  color: '$fg',
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
  fontSize: '16px',
  fontWeight: '500',
  appearance: 'none',
  color: '$fg',
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
  pointerVvents: 'none',
  display: 'flex',
  alignItems: 'center',
  transition: 'border .2s ease 0s',
});

// * NOTE: this is temporary implementation waiting for radix-select
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Select: React.FC = ({ children, props }: any) => (
  <Root>
    <Arrow>
      <ChevronDownIcon />
    </Arrow>
    <SelectRoot {...props}>{children}</SelectRoot>
  </Root>
);

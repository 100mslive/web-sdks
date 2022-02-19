import React from 'react';
import { ChevronDownIcon } from '@100mslive/react-icons';
import { styled } from '../Theme';

const Root = styled('div', {
  color: '$textPrimary',
  display: 'inline-flex',
  position: 'relative',
  outline: 'none',
  overflow: 'hidden',
  borderRadius: '8px',
  backgroundColor: '$grey2',
  maxWidth: '100%',
});

// TODO: replace these with tokens
const SelectRoot = styled('select', {
  fontSize: '$md',
  fontWeight: '500',
  appearance: 'none',
  color: '$textPrimary',
  padding: '5px',
  paddingLeft: '12px',
  paddingRight: '30px',
  border: 'none',
  borderRadius: '8px',
  backgroundColor: '$bgTertiary',
  '&:not([disabled]):focus-visible': {
    boxShadow: '0 0 0 3px $colors$brandDefault',
  },
  '&[disabled]': {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
});

const Arrow = styled('span', {
  color: '$grayDefault',
  width: '30px',
  height: '100%',
  position: 'absolute',
  right: 0,
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  transition: 'border .2s ease 0s',
});

const DefaultDownIcon = ({ ...props }) => (
  <Arrow {...props}>
    <ChevronDownIcon />
  </Arrow>
);

export const Select = {
  Root,
  DownIcon: Arrow,
  DefaultDownIcon,
  Select: SelectRoot,
};

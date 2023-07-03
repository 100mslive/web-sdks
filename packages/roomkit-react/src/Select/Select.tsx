import React from 'react';
import { ChevronDownIcon } from '@100mslive/react-icons';
import { styled } from '../Theme';

const Root = styled('div', {
  color: '$textPrimary',
  display: 'inline-flex',
  position: 'relative',
  outline: 'none',
  overflow: 'hidden',
  borderRadius: '$1',
  backgroundColor: '$menuBg',
  maxWidth: '100%',
});

// TODO: replace these with tokens
const SelectRoot = styled('select', {
  h: '$16',
  fontSize: '$md',
  fontWeight: '500',
  appearance: 'none',
  color: '$textAccentHigh',
  padding: '5px',
  paddingLeft: '12px',
  paddingRight: '30px',
  border: 'none',
  borderRadius: '8px',
  backgroundColor: '$secondaryDefault',
  '&:not([disabled]):focus-visible': {
    boxShadow: '0 0 0 3px $colors$brandDefault',
  },
  '&[disabled]': {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
});

const Arrow = styled('span', {
  color: '$textAccentMedium',
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

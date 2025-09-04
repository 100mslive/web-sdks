import React from 'react';
import { ChevronDownIcon } from '@100mslive/react-icons';
import { styled } from '../styled-system';

const Root = styled('div', {
  base: {
    color: 'onPrimary.high',
    display: 'inline-flex',
    position: 'relative',
    outline: 'none',
    overflow: 'hidden',
    borderRadius: 'token(radii.1)',
    backgroundColor: 'surface.default',
    maxWidth: '100%',
  },
});

const SelectRoot = styled('select', {
  base: {
    height: 'token(spacing.16)',
    fontSize: 'md',
    fontWeight: '500',
    lineHeight: 'inherit',
    textTransform: 'none',
    appearance: 'none',
    color: 'onSecondary.high',
    padding: '5px',
    paddingLeft: '12px',
    paddingRight: '30px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: 'secondary.default',
    '&:not([disabled]):focus-visible': {
      boxShadow: '0 0 0 3px token(colors.primary.default)',
    },
    '&[disabled]': {
      opacity: '0.5',
      cursor: 'not-allowed',
    },
  },
});

const Arrow = styled('span', {
  base: {
    color: 'onSecondary.high',
    width: '30px',
    height: '100%',
    position: 'absolute',
    right: '0',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    transition: 'border .2s ease 0s',
  },
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

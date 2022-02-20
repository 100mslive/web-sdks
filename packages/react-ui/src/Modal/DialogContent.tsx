import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { CrossIcon } from '@100mslive/react-icons';
import { styled } from '../Theme';
import { dialogClose, dialogOpen } from '../utils/animations';
import { IconButton } from '../IconButton';

export const DialogClose = styled(DialogPrimitive.Close, {});

export const StyledDialogOverlay = styled(DialogPrimitive.Overlay, {
  backgroundColor: 'rgba(0, 0, 0, 0.5);',
  position: 'fixed',
  inset: 0,
});

export const StyledDialogContent = styled(DialogPrimitive.Content, {
  color: 'white',
  backgroundColor: '$bgPrimary',
  borderRadius: '8px',
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: 999,
  padding: '1.5rem',
  '@allowMotion': {
    '&[data-state="open"]': {
      animation: `${dialogOpen} 150ms cubic-bezier(0.16, 1, 0.3, 1)`,
    },
    '&[data-state="closed"]': {
      animation: `${dialogClose} 150ms cubic-bezier(0.16, 1, 0.3, 1)`,
    },
  },
  '&:focus': { outline: 'none' },
});

export const DialogTitle = styled(DialogPrimitive.Title, {});

export const DialogDefaultCloseIcon = () => (
  <DialogClose asChild>
    <IconButton>
      <CrossIcon />
    </IconButton>
  </DialogClose>
);

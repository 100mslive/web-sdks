import React, { ComponentProps } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { CrossIcon } from '@100mslive/react-icons';
import { IconButton } from '../IconButton';
import { styled } from '../Theme';
import { dialogClose, dialogOpen } from '../utils/animations';

export const DialogClose = styled(DialogPrimitive.Close, {});

export const StyledDialogTrigger = styled(DialogPrimitive.Trigger, {
  appearance: 'none !important', // Needed for safari it shows white overlay
});

export const StyledDialogOverlay = styled(DialogPrimitive.Overlay, {
  backgroundColor: 'rgba(0, 0, 0, 0.5);',
  position: 'fixed',
  inset: 0,
});

export const StyledDialogPortal = styled(DialogPrimitive.Portal, {});

export const StyledDialogContent = styled(DialogPrimitive.Content, {
  color: '$textMedEmp',
  backgroundColor: '$surfaceDefault',
  borderRadius: '8px',
  position: 'fixed',
  top: '50%',
  left: '50%',
  border: '$space$px solid $borderDefault',
  boxShadow: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
  transform: 'translate(-50%, -50%)',
  zIndex: 999,
  padding: '$12',
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

export const DialogTitle = styled(DialogPrimitive.Title, {
  margin: 0,
});

export const DialogDescription = styled(DialogPrimitive.Description, {});

export const DialogDefaultCloseIcon = (props: ComponentProps<typeof IconButton>) => (
  <DialogClose asChild>
    <IconButton {...props}>
      <CrossIcon />
    </IconButton>
  </DialogClose>
);

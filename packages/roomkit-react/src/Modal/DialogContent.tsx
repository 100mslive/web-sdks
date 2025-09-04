import React, { ComponentProps } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { CrossIcon } from '@100mslive/react-icons';
import { IconButton } from '../IconButton';
import { styled } from '../styled-system';
import { dialogClose, dialogOpen } from '../utils/animations';

export const DialogClose = styled(DialogPrimitive.Close, {
  base: {
    backgroundColor: 'transparent',
    padding: '0',
    margin: '0',
    border: 'none',
    backgroundImage: 'none',
  },
});

export const StyledDialogTrigger = styled(DialogPrimitive.Trigger, {
  base: {
    appearance: 'none !important', // Needed for safari it shows white overlay
  },
});

export const CustomDialogOverlay = styled(DialogPrimitive.Overlay, {
  base: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    position: 'absolute',
    inset: '0',
  },
});

export const StyledDialogPortal = styled(DialogPrimitive.Portal, {});

export const CustomDialogContent = styled(DialogPrimitive.Content, {
  base: {
    color: 'onSurface.medium',
    backgroundColor: 'surface.dim',
    borderRadius: '8px',
    position: 'absolute',
    top: '50%',
    left: '50%',
    maxHeight: '95%',
    overflowY: 'auto',
    border: '1px solid token(colors.border.bright)',
    boxShadow: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
    transform: 'translate(-50%, -50%)',
    zIndex: '999',
    padding: 'token(spacing.12)',
    '&:focus': {
      outline: 'none',
    },
    '&[data-state="open"]': {
      animation: `${dialogOpen} 150ms cubic-bezier(0.16, 1, 0.3, 1)`,
    },
    '&[data-state="closed"]': {
      animation: `${dialogClose} 150ms cubic-bezier(0.16, 1, 0.3, 1)`,
    },
  },
  conditions: {
    allowMotion: {
      '&[data-state="open"]': {
        animation: `${dialogOpen} 150ms cubic-bezier(0.16, 1, 0.3, 1)`,
      },
      '&[data-state="closed"]': {
        animation: `${dialogClose} 150ms cubic-bezier(0.16, 1, 0.3, 1)`,
      },
    },
  },
});

export const DialogTitle = styled(DialogPrimitive.Title, {
  base: {
    margin: '0',
  },
});

export const DialogDescription = styled(DialogPrimitive.Description, {});

export const DialogDefaultCloseIcon = (props: ComponentProps<typeof IconButton>) => (
  <DialogClose asChild>
    <IconButton {...props}>
      <CrossIcon />
    </IconButton>
  </DialogClose>
);

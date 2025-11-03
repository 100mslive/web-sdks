import { ComponentProps } from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { CrossIcon } from '@100mslive/react-icons';
import { IconButton } from '../IconButton';
import { styled } from '../Theme';
import { dialogClose, dialogOpen } from '../utils/animations';

export const DialogClose = styled(DialogPrimitive.Close, {
  backgroundColor: 'transparent',
  padding: '0',
  margin: '0',
  border: 'none',
  backgroundImage: 'none',
});

export const StyledDialogTrigger = styled(DialogPrimitive.Trigger, {
  appearance: 'none !important', // Needed for safari it shows white overlay
});

export const CustomDialogOverlay = styled(DialogPrimitive.Overlay, {
  backgroundColor: 'rgba(0, 0, 0, 0.5);',
  position: 'absolute',
  inset: 0,
});

export const StyledDialogPortal = styled(DialogPrimitive.Portal, {});

export const CustomDialogContent = styled(DialogPrimitive.Content, {
  color: '$on_surface_medium',
  backgroundColor: '$surface_dim',
  borderRadius: '8px',
  position: 'absolute',
  top: '50%',
  left: '50%',
  maxHeight: '95%',
  overflowY: 'auto',
  border: '$space$px solid $border_bright',
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

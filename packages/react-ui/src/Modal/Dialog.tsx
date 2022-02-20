import { Root, Trigger } from '@radix-ui/react-dialog';
import { styled } from '@stitches/react';
import React from 'react';
import type * as Stitches from '@stitches/react';
import {
  DialogClose,
  DialogDefaultCloseIcon,
  DialogTitle,
  StyledDialogContent,
  StyledDialogOverlay,
} from './DialogContent';

const StyledDialog = styled(Root, {});

type DialogProps = Stitches.VariantProps<typeof StyledDialog>;

export const Dialog: React.FC<DialogProps> & {
  Trigger: typeof Trigger;
  Overlay: typeof StyledDialogOverlay;
  Content: typeof StyledDialogContent;
  Title: typeof DialogTitle;
  Close: typeof DialogClose;
  DefaultClose: typeof DialogDefaultCloseIcon;
} = props => <StyledDialog {...props} />;

Dialog.Trigger = Trigger;
Dialog.Overlay = StyledDialogOverlay;
Dialog.Content = StyledDialogContent;
Dialog.Title = DialogTitle;
Dialog.Close = DialogClose;
Dialog.DefaultClose = DialogDefaultCloseIcon;

Dialog.displayName = 'Dialog';

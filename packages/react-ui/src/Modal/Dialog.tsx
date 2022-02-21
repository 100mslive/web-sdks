import { Root, Trigger } from '@radix-ui/react-dialog';
import { styled } from '@stitches/react';
import {
  DialogClose,
  DialogDefaultCloseIcon,
  DialogTitle,
  StyledDialogContent,
  StyledDialogOverlay,
} from './DialogContent';

const StyledDialog = styled(Root, {});

export const Dialog = {
  Root: StyledDialog,
  Trigger: Trigger,
  Overlay: StyledDialogOverlay,
  Content: StyledDialogContent,
  Title: DialogTitle,
  Close: DialogClose,
  DefaultClose: DialogDefaultCloseIcon,
};

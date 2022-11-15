import { Root } from '@radix-ui/react-dialog';
import { styled } from '@stitches/react';
import {
  DialogClose,
  DialogDefaultCloseIcon,
  DialogDescription,
  DialogTitle,
  StyledDialogContent,
  StyledDialogOverlay,
  StyledDialogPortal,
  StyledDialogTrigger,
} from './DialogContent';

const StyledDialog = styled(Root, {});

export const Dialog = {
  Root: StyledDialog,
  Trigger: StyledDialogTrigger,
  Overlay: StyledDialogOverlay,
  Content: StyledDialogContent,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: DialogClose,
  DefaultClose: DialogDefaultCloseIcon,
  Portal: StyledDialogPortal,
};

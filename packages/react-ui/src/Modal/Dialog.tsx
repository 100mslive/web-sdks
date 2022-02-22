import { Root } from '@radix-ui/react-dialog';
import { styled } from '@stitches/react';
import {
  DialogClose,
  DialogDefaultCloseIcon,
  DialogTitle,
  StyledDialogContent,
  StyledDialogOverlay,
  StyledDialogTrigger,
} from './DialogContent';

const StyledDialog = styled(Root, {});

export const Dialog = {
  Root: StyledDialog,
  Trigger: StyledDialogTrigger,
  Overlay: StyledDialogOverlay,
  Content: StyledDialogContent,
  Title: DialogTitle,
  Close: DialogClose,
  DefaultClose: DialogDefaultCloseIcon,
};

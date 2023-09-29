import React, { ReactNode } from 'react';
import { Root } from '@radix-ui/react-dialog';
import { styled } from '@stitches/react';
import { CSS } from '../Theme';
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
const CustomDialogContent = ({ children, props = {}, css = {} }: { children: ReactNode; props?: any; css?: CSS }) => (
  <StyledDialogContent css={{ ...css, position: 'absolute' }} {...props}>
    {children}
  </StyledDialogContent>
);
const CustomDialogOverlay = ({ css = {} }: { css?: CSS }) => (
  <StyledDialogOverlay css={{ ...css, position: 'absolute' }} />
);
const CustomDialogPortal = ({ children }: { children: ReactNode }) => (
  <StyledDialogPortal container={document.getElementById('prebuilt-container')}>{children}</StyledDialogPortal>
);

export const Dialog = {
  Root: StyledDialog,
  Trigger: StyledDialogTrigger,
  Overlay: CustomDialogOverlay,
  Content: CustomDialogContent,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: DialogClose,
  DefaultClose: DialogDefaultCloseIcon,
  Portal: CustomDialogPortal,
};

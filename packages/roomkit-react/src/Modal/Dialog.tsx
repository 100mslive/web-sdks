import React from 'react';
import { Root } from '@radix-ui/react-dialog';
import { styled } from '@stitches/react';
import { ReactNode } from 'react';
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
import { CSS } from '../Theme';

const StyledDialog = styled(Root, {});
const CustomDialogContent = ({ children, props, css }: { children: ReactNode; props: any; css: CSS }) => (
  <StyledDialogContent css={{ ...css, position: 'absolute' }} {...props}>
    {children}
  </StyledDialogContent>
);
const CustomDialogOverlay = () => <StyledDialogOverlay css={{ position: 'absolute' }} />;
const PrebuiltDialogPortal = ({ children }: { children: ReactNode }) => (
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
  Portal: PrebuiltDialogPortal,
};

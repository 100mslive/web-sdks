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
import { useDialogContainerSelector } from '../hooks/useDialogContainerSelector';

const StyledDialog = styled(Root, {});
const CustomDialogContent = ({ children, props = {}, css = {} }: { children: ReactNode; props?: any; css?: CSS }) => (
  <StyledDialogContent css={{ ...css, position: 'absolute' }} {...props}>
    {children}
  </StyledDialogContent>
);
const CustomDialogOverlay = ({ css = {} }: { css?: CSS }) => (
  <StyledDialogOverlay css={{ ...css, position: 'absolute' }} />
);
const CustomDialogPortal = ({ children }: { children: ReactNode }) => {
  const dialogContainerSelector = useDialogContainerSelector();
  return (
    <StyledDialogPortal
      container={dialogContainerSelector ? (document.querySelector(dialogContainerSelector) as HTMLElement) : undefined}
    >
      {children}
    </StyledDialogPortal>
  );
};

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

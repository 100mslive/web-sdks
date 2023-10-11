import React, { ReactNode, useRef } from 'react';
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
const CustomDialogPortal = ({ children, container }: { children: ReactNode; container?: HTMLElement | null }) => {
  const dialogContainerSelector = useDialogContainerSelector();
  const containerRef = useRef<HTMLElement | null>(null);

  if (container) {
    containerRef.current = container;
  } else if (dialogContainerSelector && !containerRef.current) {
    containerRef.current = document.querySelector(dialogContainerSelector) as HTMLElement;
  }

  return <StyledDialogPortal container={containerRef.current}>{children}</StyledDialogPortal>;
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

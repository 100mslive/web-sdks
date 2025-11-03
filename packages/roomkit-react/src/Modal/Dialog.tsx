import { ComponentProps, ReactNode, useEffect, useRef } from 'react';
import { styled } from '@stitches/react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import {
  CustomDialogContent,
  CustomDialogOverlay,
  DialogClose,
  DialogDefaultCloseIcon,
  DialogDescription,
  DialogTitle,
  StyledDialogPortal,
  StyledDialogTrigger,
} from './DialogContent';
import { useDialogContainerSelector } from '../hooks/useDialogContainerSelector';
const { Root } = DialogPrimitive;

const StyledDialog = styled(Root, {});

// Handles race conditions when multiple elements with dismissable layer are present
// https://github.com/radix-ui/primitives/issues/2122
const DialogRoot = <T extends ComponentProps<typeof StyledDialog>>(props: T) => {
  useEffect(() => {
    return () => {
      if (document) setTimeout(() => (document.body.style.pointerEvents = 'auto'), 0);
    };
  }, []);
  return <StyledDialog {...(props as object)} />;
};

const CustomDialogPortal = ({ children, container }: { children: ReactNode; container?: HTMLElement | null }) => {
  const dialogContainerSelector = useDialogContainerSelector();
  const containerRef = useRef<HTMLElement | null>(null);

  if (container) {
    containerRef.current = container;
  } else if (dialogContainerSelector && !containerRef.current) {
    containerRef.current = document.querySelector(dialogContainerSelector) as HTMLElement;
  } else if (!containerRef.current) {
    containerRef.current = document.body;
  }
  return (
    <StyledDialogPortal container={containerRef.current}>
      <>{children}</>
    </StyledDialogPortal>
  );
};

export const Dialog = {
  Root: DialogRoot,
  Trigger: StyledDialogTrigger,
  Overlay: CustomDialogOverlay,
  Content: CustomDialogContent,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: DialogClose,
  DefaultClose: DialogDefaultCloseIcon,
  Portal: CustomDialogPortal,
};

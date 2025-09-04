import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog } from '../Modal';
import { styled } from '../styled-system';
import { type RecipeVariantProps, cva } from '../styled-system';
import { sheetFadeIn, sheetFadeOut, sheetSlideIn, sheetSlideOut } from '../utils';

const SheetRoot = styled(DialogPrimitive.Root, {
  base: {
    minHeight: '240px',
    maxWidth: '100%',
  },
});

const SheetTrigger = styled(DialogPrimitive.Trigger, {
  base: {
    appearance: 'none !important', // Needed for safari it shows white overlay
  },
});

const StyledOverlay = styled(Dialog.Overlay, {
  base: {
    top: '0',
    right: '0',
    bottom: '0',
    left: '0',
    '&[data-state="open"]': {
      animation: `${sheetFadeIn} 150ms cubic-bezier(0.22, 1, 0.36, 1)`,
    },
    '&[data-state="closed"]': {
      animation: `${sheetFadeOut} 150ms cubic-bezier(0.22, 1, 0.36, 1)`,
    },
  },
});

// Create a CVA variant for the content
const sheetContentVariants = cva({
  base: {
    color: 'onSurface.medium',
    backgroundColor: 'surface.default',
    borderTopLeftRadius: 'token(radii.3)',
    borderTopRightRadius: 'token(radii.3)',
    boxShadow: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
    position: 'fixed',
    zIndex: '22',
    top: '0',
    right: '0',
    left: '0',
    bottom: '0',
    maxHeight: '96%',
    willChange: 'transform',
    '&:focus': {
      outline: 'none',
    },
    '&[data-state="open"]': {
      animation: `${sheetSlideIn} 150ms cubic-bezier(0.22, 1, 0.36, 1)`,
    },
    '&[data-state="closed"]': {
      animation: `${sheetSlideOut} 150ms cubic-bezier(0.22, 1, 0.36, 1)`,
    },
  },
  variants: {
    side: {
      top: {
        bottom: 'auto',
        '--transform-value': 'translate3d(0,-100%,0)',
      },
      right: {
        right: '0',
        '--transform-value': 'translate3d(100%,0,0)',
      },
      bottom: {
        bottom: '0',
        top: 'auto',
        '--transform-value': 'translate3d(0,100%,0)',
      },
      left: {
        left: '0',
        '--transform-value': 'translate3d(-100%,0,0)',
      },
    },
  },
  defaultVariants: {
    side: 'bottom',
  },
});

const StyledContent = styled(DialogPrimitive.Content, sheetContentVariants);

type SheetContentVariants = RecipeVariantProps<typeof sheetContentVariants>;
type DialogContentPrimitiveProps = React.ComponentProps<typeof DialogPrimitive.Content>;
type SheetContentProps = DialogContentPrimitiveProps &
  SheetContentVariants & {
    style?: Record<string, any>;
    container?: HTMLElement;
  };

const SheetContent = React.forwardRef<React.ElementRef<typeof StyledContent>, SheetContentProps>(
  ({ children, container, ...props }, forwardedRef) => (
    <Dialog.Portal container={container}>
      <StyledOverlay />
      <StyledContent {...props} ref={forwardedRef}>
        {children}
      </StyledContent>
    </Dialog.Portal>
  ),
);
const SheetClose = Dialog.Close;
const SheetTitle = styled(DialogPrimitive.Title, {
  base: {
    margin: '0',
  },
});
const SheetDescription = Dialog.Description;
const SheetDefaultCloseIcon = Dialog.DefaultClose;

export const Sheet = {
  Root: SheetRoot,
  Trigger: SheetTrigger,
  Content: SheetContent,
  Description: SheetDescription,
  Title: SheetTitle,
  Close: SheetClose,
  DefaultClose: SheetDefaultCloseIcon,
};

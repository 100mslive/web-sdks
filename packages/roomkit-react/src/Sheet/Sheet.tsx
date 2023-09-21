import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { CSS, VariantProps } from '@stitches/react';
import { Dialog } from '../Modal';
import { styled } from '../Theme';
import { sheetFadeIn, sheetFadeOut, sheetSlideIn, sheetSlideOut } from '../utils';

const SheetRoot = styled(DialogPrimitive.Root, {
  minHeight: '240px',
  maxWidth: '100%',
});
const SheetTrigger = styled(DialogPrimitive.Trigger, {
  appearance: 'none !important', // Needed for safari it shows white overlay
});

const StyledOverlay = styled(Dialog.Overlay, {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,

  '&[data-state="open"]': {
    animation: `${sheetFadeIn} 150ms cubic-bezier(0.22, 1, 0.36, 1)`,
  },

  '&[data-state="closed"]': {
    animation: `${sheetFadeOut} 150ms cubic-bezier(0.22, 1, 0.36, 1)`,
  },
});

const StyledContent = styled(DialogPrimitive.Content, {
  color: '$on_surface_medium',
  backgroundColor: '$surface_default',
  borderTopLeftRadius: '$3',
  borderTopRightRadius: '$3',
  boxShadow: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
  position: 'fixed',
  zIndex: 1001,
  top: 0,
  right: 0,
  left: 0,
  bottom: 0,
  maxHeight: '96%',

  // Among other things, prevents text alignment inconsistencies when dialog can't be centered in the viewport evenly.
  // Affects animated and non-animated dialogs alike.
  willChange: 'transform',

  '&:focus': {
    outline: 'none',
  },
  '@allowMotion': {
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
        $$transformValue: 'translate3d(0,-100%,0)',
        bottom: 'auto',
      },
      right: {
        $$transformValue: 'translate3d(100%,0,0)',
        right: 0,
      },
      bottom: {
        $$transformValue: 'translate3d(0,100%,0)',
        bottom: 0,
        top: 'auto',
      },
      left: {
        $$transformValue: 'translate3d(-100%,0,0)',
        left: 0,
      },
    },
  },

  defaultVariants: {
    side: 'bottom',
  },
});

type SheetContentVariants = VariantProps<typeof StyledContent>;
type DialogContentPrimitiveProps = React.ComponentProps<typeof DialogPrimitive.Content>;
type SheetContentProps = DialogContentPrimitiveProps & SheetContentVariants & { css?: CSS };

const SheetContent = React.forwardRef<React.ElementRef<typeof StyledContent>, SheetContentProps>(
  ({ children, ...props }, forwardedRef) => (
    <Dialog.Portal>
      <StyledOverlay />
      <StyledContent {...props} ref={forwardedRef}>
        {children}
      </StyledContent>
    </Dialog.Portal>
  ),
);
const SheetClose = Dialog.Close;
const SheetTitle = styled(DialogPrimitive.Title, {
  margin: 0,
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

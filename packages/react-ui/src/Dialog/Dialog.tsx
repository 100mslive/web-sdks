import { Dialog as Root, DialogContent, DialogClose, DialogOverlay, DialogTrigger } from '@radix-ui/react-dialog';
import { styled, keyframes } from '../Theme/stitches.config';

const contentShow = keyframes({
  '0%': { opacity: 0, transform: 'translate(-50%, -48%) scale(.90)' },
  '100%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
});

const Content = styled(DialogContent, {
  color: 'White',
  backgroundColor: '$grey1',
  borderRadius: '8px',
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90vw',
  maxWidth: '480px',
  maxHeight: '85vh',
  padding: '20px',
  '@media (prefers-reduced-motion: no-preference)': {
    animation: `${contentShow} 150ms cubic-bezier(0.16, 1, 0.3, 1)`,
    willChange: 'transform',
  },
  '&:focus': { outline: 'none' },
});

const Overlay = styled(DialogOverlay, {
  backgroundColor: 'rgba(0, 0, 0, 0.5);',
  position: 'fixed',
  inset: 0,
});

export type DialogComponentType = {
  Root: typeof Root;
  Close: typeof DialogClose;
  Content: typeof Content;
  Overlay: typeof Overlay;
  Trigger: typeof DialogTrigger;
};

export const Dialog: DialogComponentType = {
  Root,
  Close: DialogClose,
  Content,
  Overlay,
  Trigger: DialogTrigger,
};

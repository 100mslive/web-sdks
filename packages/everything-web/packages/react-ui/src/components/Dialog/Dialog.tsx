import { styled, keyframes } from '../../../stitches.config';
import {
    Dialog as Root,
    DialogTrigger,
    DialogContent,
    DialogClose,
    DialogOverlay
} from '@radix-ui/react-dialog';

const contentShow = keyframes({
    '0%': { opacity: 0, transform: 'translate(-50%, -48%) scale(.90)' },
    '100%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' }
});

const Icon = styled(DialogTrigger, {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: '$sans',
    outline: 'none',
    border: 'none',
    padding: '4px',
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: 'White',
    '&:focus': {
        boxShadow: '0 0 0 3px $colors$brandTint'
    },
    '&:hover': {
        backgroundColor: '$grey2'
    }
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
    maxWidth: '450px',
    maxHeight: '85vh',
    padding: '20px',
    '@media (prefers-reduced-motion: no-preference)': {
        animation: `${contentShow} 150ms cubic-bezier(0.16, 1, 0.3, 1)`,
        willChange: 'transform'
    },
    '&:focus': { outline: 'none' }
});

const Close = styled(DialogClose, {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: '$sans',
    outline: 'none',
    border: 'none',
    padding: '4px',
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: 'White',
    '&:focus': {
        boxShadow: '0 0 0 3px $colors$brandTint'
    },
    '&:hover': {
        backgroundColor: '$grey2'
    }
});

const Overlay = styled(DialogOverlay, {
    backgroundColor: 'rgba(0, 0, 0, 0.5);',
    position: 'fixed',
    inset: 0
});

export const Dialog = {
    Root,
    Content,
    Icon,
    Close,
    Overlay
};

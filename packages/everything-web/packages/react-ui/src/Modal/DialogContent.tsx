import React from 'react';
import { Close, Content, Overlay } from '@radix-ui/react-dialog';
import { CrossIcon } from '@100mslive/react-icons';
import { styled } from '../stitches.config';
import { dialogClose, dialogOpen } from '../utils/animations';
import { IconButton } from '../IconButton';
import { HorizontalDivider } from '../Divider';
import { Flex, Text } from '..';

export const DialogClose = styled(Close, {});

const StyledOverlay = styled(Overlay, {
    backgroundColor: 'rgba(0, 0, 0, 0.5);',
    position: 'fixed',
    inset: 0
});

const StyledDialogContent = styled(Content, {
    color: 'white',
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
    '@allowMotion': {
        '&[data-state="open"]': {
            animation: `${dialogOpen} 150ms cubic-bezier(0.16, 1, 0.3, 1)`
        },
        '&[data-state="closed"]': {
            animation: `${dialogClose} 150ms cubic-bezier(0.16, 1, 0.3, 1)`
        }
    },
    '&:focus': { outline: 'none' }
});

type DialogContentProps = React.ComponentProps<typeof StyledDialogContent> & {
    title: string;
};

export const DialogContent: React.FC<DialogContentProps> = ({ children, title, ...props }) => (
    <>
        <StyledOverlay />
        <StyledDialogContent {...props}>
            <Flex justify="between">
                <Text variant="heading-md">{title}</Text>
                <DialogClose asChild>
                    <IconButton>
                        <CrossIcon />
                    </IconButton>
                </DialogClose>
            </Flex>
            <HorizontalDivider space={4} />
            {children}
        </StyledDialogContent>
    </>
);

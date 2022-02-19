import React, { ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { CrossIcon } from '@100mslive/react-icons';
import { styled } from '../Theme';
import { dialogClose, dialogOpen } from '../utils/animations';
import { IconButton } from '../IconButton';
import { Flex, Box } from '../Layout';
import { Text } from '../Text';

export const DialogClose = styled(DialogPrimitive.Close, {});

const StyledOverlay = styled(DialogPrimitive.Overlay, {
  backgroundColor: 'rgba(0, 0, 0, 0.5);',
  position: 'fixed',
  inset: 0,
});

const StyledDialogContent = styled(DialogPrimitive.Content, {
  color: 'white',
  backgroundColor: '$bgPrimary',
  borderRadius: '8px',
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: 999,
  padding: '1.5rem',
  '@allowMotion': {
    '&[data-state="open"]': {
      animation: `${dialogOpen} 150ms cubic-bezier(0.16, 1, 0.3, 1)`,
    },
    '&[data-state="closed"]': {
      animation: `${dialogClose} 150ms cubic-bezier(0.16, 1, 0.3, 1)`,
    },
  },
  '&:focus': { outline: 'none' },
});

type DialogContentProps = React.ComponentProps<typeof StyledDialogContent> & {
  title: string | ReactNode;
  /**
   * Whether to render close button
   */
  close?: boolean;
};

export const DialogContent: React.FC<DialogContentProps> = ({ children, close = true, title, ...props }) => (
  <>
    <StyledOverlay />
    <StyledDialogContent {...props}>
      <Flex justify="between">
        <Text variant="h6" css={{ mb: '$2' }}>
          {title}
        </Text>
        {close && (
          <DialogClose asChild>
            <IconButton>
              <CrossIcon />
            </IconButton>
          </DialogClose>
        )}
      </Flex>
      <Box css={{ color: 'rgba(255,255,255, 0.7)' }}>{children}</Box>
    </StyledDialogContent>
  </>
);

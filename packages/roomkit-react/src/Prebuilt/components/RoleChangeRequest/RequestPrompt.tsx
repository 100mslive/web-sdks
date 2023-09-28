import React from 'react';
import { useMedia } from 'react-use';
import { Box, Button, config as cssConfig, Dialog, Flex, Text } from '../../..';
import { Sheet } from '../../../Sheet';
import { PrebuiltDialogPortal } from '../PrebuiltDialogElements';

export const RequestPrompt = ({
  open = true,
  onOpenChange,
  title,
  body,
  actionText = 'Accept',
  onAction,
}: {
  open?: boolean;
  onOpenChange: (value: boolean) => void;
  title: string;
  body: React.ReactNode;
  actionText?: string;
  onAction: () => void;
}) => {
  const isMobile = useMedia(cssConfig.media.md);

  if (isMobile) {
    return (
      <Sheet.Root open={open} onOpenChange={onOpenChange}>
        <Sheet.Content css={{ py: '$8' }}>
          <Text css={{ fontWeight: '$semiBold', c: '$on_surface_high', '@md': { px: '$8' } }}>{title}</Text>
          {body}
          <RequestActions actionText={actionText} onAction={onAction} />
        </Sheet.Content>
      </Sheet.Root>
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <PrebuiltDialogPortal>
        <Dialog.Overlay />
        <Dialog.Content css={{ p: '$10' }}>
          <Dialog.Title css={{ p: 0, display: 'flex', flexDirection: 'row', gap: '$md', justifyContent: 'center' }}>
            <Text variant="h6">{title}</Text>
          </Dialog.Title>
          <Box css={{ mt: '$4', mb: '$10' }}>{body}</Box>
          <RequestActions actionText={actionText} onAction={onAction} />
        </Dialog.Content>
      </PrebuiltDialogPortal>
    </Dialog.Root>
  );
};

const RequestActions = ({ onAction, actionText }: { actionText?: string; onAction: () => void }) => (
  <Flex justify="center" align="center" css={{ width: '100%', gap: '$md', '@md': { mt: '$8', px: '$8' } }}>
    <Box css={{ width: '50%' }}>
      <Dialog.Close css={{ width: '100%' }}>
        <Button variant="standard" outlined css={{ width: '100%' }}>
          Decline
        </Button>
      </Dialog.Close>
    </Box>
    <Box css={{ width: '50%' }}>
      <Button variant="primary" css={{ width: '100%' }} onClick={onAction}>
        {actionText}
      </Button>
    </Box>
  </Flex>
);

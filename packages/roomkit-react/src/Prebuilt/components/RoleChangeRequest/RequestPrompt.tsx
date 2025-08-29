import React from 'react';
import { Box, Button, config as cssConfig, Dialog, Flex, Text } from '../../..';
import { Sheet } from '../../../Sheet';
import { useContainerQuery } from '../hooks/useContainerQuery';

export const RequestPrompt = ({
  open = true,
  onOpenChange,
  title,
  body,
  actionText = 'Accept',
  onAction,
  disableActions = false,
}: {
  open?: boolean;
  onOpenChange: (value: boolean) => void;
  title: string;
  body: React.ReactNode;
  actionText?: string;
  onAction: () => void;
  disableActions?: boolean;
}) => {
  const isMobile = useContainerQuery(cssConfig.media.md);

  if (isMobile) {
    return (
      <Sheet.Root open={open} onOpenChange={onOpenChange}>
        <Sheet.Content css={{ py: '$8' }}>
          <Text css={{ fontWeight: '$semiBold', c: '$on_surface_high', containerMd: { px: '$8' } }}>{title}</Text>
          {body}
          <RequestActions actionText={actionText} onAction={onAction} disabled={disableActions} />
        </Sheet.Content>
      </Sheet.Root>
    );
  }

  return (
    <Dialog.Root open={open} modal={false} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Content css={{ p: '$10' }} onInteractOutside={e => e.preventDefault()}>
          <Dialog.Title css={{ p: 0, display: 'flex', flexDirection: 'row', gap: '$md', justifyContent: 'center' }}>
            <Text variant="h6">{title}</Text>
          </Dialog.Title>
          <Box css={{ mt: '$4', mb: '$10' }}>{body}</Box>
          <RequestActions actionText={actionText} onAction={onAction} disabled={disableActions} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

const RequestActions = ({
  onAction,
  actionText,
  disabled = false,
}: {
  actionText?: string;
  onAction: () => void;
  disabled?: boolean;
}) => (
  <Flex justify="center" align="center" css={{ width: '100%', gap: '$md', containerMd: { mt: '$8', px: '$8' } }}>
    <Box css={{ width: '50%' }}>
      <Dialog.Close css={{ width: '100%', height: '100%' }} asChild>
        <Button variant="standard" outlined css={{ width: '100%', p: '$4 $8' }} disabled={disabled}>
          Decline
        </Button>
      </Dialog.Close>
    </Box>
    <Box css={{ width: '50%' }}>
      <Button variant="primary" css={{ width: '100%' }} onClick={onAction} disabled={disabled}>
        {actionText}
      </Button>
    </Box>
  </Flex>
);

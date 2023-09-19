import React, { useEffect } from 'react';
import { useMedia } from 'react-use';
import {
  selectLocalPeerName,
  selectLocalPeerRoleName,
  selectRoleChangeRequest,
  useCustomEvent,
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';
// @ts-ignore: No implicit Any
import { PreviewControls, PreviewTile } from './Preview/PreviewJoin';
import { Box, Button, config as cssConfig, Dialog, Flex, Text } from '../..';
import { Sheet } from '../../Sheet';
// @ts-ignore: No implicit Any
import { useMyMetadata } from './hooks/useMetadata';
// @ts-ignore: No implicit Any
import { ROLE_CHANGE_DECLINED } from '../common/constants';

export const RoleChangeRequestModal = () => {
  const hmsActions = useHMSActions();
  const { updateMetaData } = useMyMetadata();
  const currentRole = useHMSStore(selectLocalPeerRoleName);
  const roleChangeRequest = useHMSStore(selectRoleChangeRequest);
  const name = useHMSStore(selectLocalPeerName);
  const { sendEvent } = useCustomEvent({ type: ROLE_CHANGE_DECLINED });

  useEffect(() => {
    if (!roleChangeRequest?.role) {
      return;
    }
    (async () => {
      await hmsActions.preview({ asRole: roleChangeRequest.role.name });
    })();
  }, [hmsActions, roleChangeRequest, currentRole, updateMetaData]);

  if (!roleChangeRequest?.role) {
    return null;
  }

  const body = (
    <>
      <Text
        variant="xs"
        css={{
          c: '$on_surface_medium',
          textAlign: 'center',
          '@md': { textAlign: 'left', borderBottom: '1px solid $border_bright', pb: '$4', px: '$8' },
        }}
      >
        Setup your audio and video before joining
      </Text>
      <Flex
        align="center"
        justify="center"
        css={{
          '@sm': { width: '100%' },
          flexDirection: 'column',
          mt: '$6',
          '@md': { px: '$8' },
        }}
      >
        <PreviewTile name={name || ''} />

        <PreviewControls hideSettings={true} />
      </Flex>
    </>
  );

  return (
    <RequestPrompt
      title={`You're invited to join the ${roleChangeRequest.role.name} role`}
      onOpenChange={async value => {
        if (!value) {
          await hmsActions.rejectChangeRole(roleChangeRequest);
          sendEvent({ ...roleChangeRequest, peerName: name }, { peerId: roleChangeRequest.requestedBy?.id });
          await hmsActions.cancelMidCallPreview();
          await hmsActions.lowerLocalPeerHand();
        }
      }}
      body={body}
      onAction={async () => {
        await hmsActions.acceptChangeRole(roleChangeRequest);
        await updateMetaData({ prevRole: currentRole });
        await hmsActions.lowerLocalPeerHand();
      }}
      actionText="Accept"
    />
  );
};

const RequestPrompt = ({
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
  const actions = (
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

  if (isMobile) {
    return (
      <Sheet.Root open={open} onOpenChange={onOpenChange}>
        <Sheet.Content css={{ py: '$8' }}>
          <Text css={{ fontWeight: '$semiBold', c: '$on_surface_high', '@md': { px: '$8' } }}>{title}</Text>
          {body}
          {actions}
        </Sheet.Content>
      </Sheet.Root>
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content css={{ p: '$10' }}>
          <Dialog.Title css={{ p: 0, display: 'flex', flexDirection: 'row', gap: '$md', justifyContent: 'center' }}>
            <Text variant="h6">{title}</Text>
          </Dialog.Title>
          <Box css={{ mt: '$4', mb: '$10' }}>{body}</Box>
          {actions}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

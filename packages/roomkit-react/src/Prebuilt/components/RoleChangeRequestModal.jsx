import React, { useCallback, useEffect } from 'react';
import {
  selectLocalPeerName,
  selectLocalPeerRoleName,
  selectRoleChangeRequest,
  useCustomEvent,
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';
import { PreviewControls, PreviewTile } from './Preview/PreviewJoin';
import { ToastManager } from './Toast/ToastManager';
import { Box, Button, Dialog, Flex, Text } from '../../';
import { useMyMetadata } from './hooks/useMetadata';

const ROLE_CHANGE_DECLINED = 'role_change_declined';

export const RoleChangeRequestModal = () => {
  const hmsActions = useHMSActions();
  const { setPrevRole, toggleHandRaise } = useMyMetadata();
  const currentRole = useHMSStore(selectLocalPeerRoleName);
  const roleChangeRequest = useHMSStore(selectRoleChangeRequest);
  const name = useHMSStore(selectLocalPeerName);

  const handleRoleChangeDenied = useCallback(request => {
    ToastManager.addToast({
      title: `${request.peerName} denied your request to join the ${request.role.name} role`,
      variant: 'error',
    });
  }, []);

  const { sendEvent } = useCustomEvent({
    type: ROLE_CHANGE_DECLINED,
    onEvent: handleRoleChangeDenied,
  });

  useEffect(() => {
    if (!roleChangeRequest?.role) {
      return;
    }

    hmsActions.preview({ asRole: roleChangeRequest.role.name });
  }, [hmsActions, roleChangeRequest]);

  if (!roleChangeRequest?.role) {
    return null;
  }

  const body = (
    <>
      <Text css={{ fontWeight: 400, c: '$on_surface_medium', textAlign: 'center' }}>
        Setup your audio and video before joining
      </Text>
      <Flex
        align="center"
        justify="center"
        css={{
          '@sm': { width: '100%' },
          flexDirection: 'column',
          mt: '$6',
        }}
      >
        <PreviewTile name={name} />
        <PreviewControls />
      </Flex>
    </>
  );

  return (
    <RequestDialog
      title={`You're invited to join the ${roleChangeRequest.role.name} role`}
      onOpenChange={async value => {
        if (!value) {
          await hmsActions.rejectChangeRole(roleChangeRequest);
          sendEvent({ ...roleChangeRequest, peerName: name }, { peerId: roleChangeRequest.requestedBy?.id });
          await hmsActions.cancelMidCallPreview();
          await toggleHandRaise();
        }
      }}
      body={body}
      onAction={() => {
        hmsActions.acceptChangeRole(roleChangeRequest);
        setPrevRole(currentRole);
        toggleHandRaise();
      }}
      actionText="Accept"
    />
  );
};

const RequestDialog = ({ open = true, onOpenChange, title, body, actionText = 'Accept', onAction, Icon }) => (
  <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay />
      <Dialog.Content css={{ p: '$10' }}>
        <Dialog.Title css={{ p: 0, display: 'flex', flexDirection: 'row', gap: '$md', justifyContent: 'center' }}>
          {Icon ? Icon : null}
          <Text variant="h6">{title}</Text>
        </Dialog.Title>
        <Box css={{ mt: '$4', mb: '$10' }}>{body}</Box>
        <Flex justify="center" align="center" css={{ width: '100%', gap: '$md' }}>
          <Box css={{ width: '50%' }}>
            <Dialog.Close css={{ width: '100%' }}>
              <Button variant="standard" outlined css={{ width: '100%' }}>
                Cancel
              </Button>
            </Dialog.Close>
          </Box>
          <Box css={{ width: '50%' }}>
            <Button variant="primary" css={{ width: '100%' }} onClick={onAction}>
              {actionText}
            </Button>
          </Box>
        </Flex>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);

import React, { useEffect } from 'react';
import { selectLocalPeerName, selectRoleChangeRequest, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
import { PreviewControls, PreviewTile } from './Preview/PreviewJoin';
import { Box, Button, Dialog, Flex, Text } from '../../';
import { useIsHeadless } from './AppData/useUISettings';

export const RoleChangeRequestModal = () => {
  const hmsActions = useHMSActions();
  const isHeadless = useIsHeadless();
  const roleChangeRequest = useHMSStore(selectRoleChangeRequest);
  const name = useHMSStore(selectLocalPeerName);

  useEffect(() => {
    if (!roleChangeRequest?.role || isHeadless) {
      return;
    }

    hmsActions.preview({ asRole: roleChangeRequest.role.name });
  }, [hmsActions, roleChangeRequest, isHeadless]);

  if (!roleChangeRequest?.role || isHeadless) {
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
      onOpenChange={value => {
        if (!value) {
          hmsActions.cancelMidCallPreview();
          hmsActions.rejectChangeRole(roleChangeRequest);
        }
      }}
      body={body}
      onAction={() => {
        hmsActions.acceptChangeRole(roleChangeRequest);
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

import React, { useEffect } from 'react';
import {
  selectLocalPeerName,
  selectLocalPeerRoleName,
  selectRoleChangeRequest,
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';
import { PreviewControls, PreviewTile } from './Preview/PreviewJoin';
import { Box, Button, Dialog, Flex, Text } from '../../';
import { useIsHeadless } from './AppData/useUISettings';
import { useMyMetadata } from './hooks/useMetadata';
import { ROLE_CHANGE_DECLINED } from '../common/constants';

export const RoleChangeRequestModal = () => {
  const hmsActions = useHMSActions();
  const isHeadless = useIsHeadless();
  const { setPrevRole } = useMyMetadata();
  const currentRole = useHMSStore(selectLocalPeerRoleName);
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
      onOpenChange={async value => {
        if (!value) {
          await hmsActions.rejectChangeRole(roleChangeRequest);
          await hmsActions.sendDirectMessage('', roleChangeRequest.requestedBy?.id, ROLE_CHANGE_DECLINED);
          await hmsActions.cancelMidCallPreview();
        }
      }}
      body={body}
      onAction={() => {
        hmsActions.acceptChangeRole(roleChangeRequest);
        setPrevRole(currentRole);
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

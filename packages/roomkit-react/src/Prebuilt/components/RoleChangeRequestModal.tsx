import React, { useEffect } from 'react';
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
import { Box, Button, Dialog, Flex, Text } from '../..';
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
        <PreviewTile name={name || ''} />
        <PreviewControls hideSettings={true} />
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
          await updateMetaData({ isHandRaised: false });
        }
      }}
      body={body}
      onAction={async () => {
        await hmsActions.acceptChangeRole(roleChangeRequest);
        await updateMetaData({ isHandRaised: false, prevRole: currentRole });
      }}
      actionText="Accept"
    />
  );
};

const RequestDialog = ({
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
}) => (
  <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay />
      <Dialog.Content css={{ p: '$10' }}>
        <Dialog.Title css={{ p: 0, display: 'flex', flexDirection: 'row', gap: '$md', justifyContent: 'center' }}>
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

import React, { useEffect } from 'react';
import {
  selectLocalPeerName,
  selectLocalPeerRoleName,
  selectRoleChangeRequest,
  useCustomEvent,
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';
import { Flex, Text } from '../../..';
// @ts-ignore: No implicit Any
import { PreviewControls, PreviewTile } from '../Preview/PreviewJoin';
import { RequestPrompt } from './RequestPrompt';
// @ts-ignore: No implicit Any
import { useMyMetadata } from '../hooks/useMetadata';
// @ts-ignore: No implicit Any
import { ROLE_CHANGE_DECLINED } from '../../common/constants';

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
      title="You're invited to join the stage"
      onOpenChange={async value => {
        if (!value) {
          hmsActions.rejectChangeRole(roleChangeRequest);
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

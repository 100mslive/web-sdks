import React, { useEffect } from 'react';
import {
  selectIsInPreview,
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
import { useRoomLayoutPreviewScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
import { useMyMetadata } from '../hooks/useMetadata';
// @ts-ignore: No implicit Any
import { ROLE_CHANGE_DECLINED } from '../../common/constants';

export const RoleChangeRequestModal = () => {
  const hmsActions = useHMSActions();
  const { updateMetaData } = useMyMetadata();
  const isPreview = useHMSStore(selectIsInPreview);
  const currentRole = useHMSStore(selectLocalPeerRoleName);
  const roleChangeRequest = useHMSStore(selectRoleChangeRequest);
  const name = useHMSStore(selectLocalPeerName);
  const { sendEvent } = useCustomEvent({ type: ROLE_CHANGE_DECLINED });
  const { elements = {} } = useRoomLayoutPreviewScreen();
  const { virtual_background } = elements || {};

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
          containerMd: { textAlign: 'left', borderBottom: '1px solid $border_bright', pb: '$4', px: '$8' },
        }}
      >
        Setup your audio and video before joining
      </Text>
      <Flex
        align="center"
        justify="center"
        css={{
          containerSm: { width: '100%' },
          flexDirection: 'column',
          mt: '$6',
          containerMd: { px: '$8' },
        }}
      >
        <PreviewTile name={name || ''} />

        <PreviewControls hideSettings={true} vbEnabled={!!virtual_background} />
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
      disableActions={!isPreview}
    />
  );
};

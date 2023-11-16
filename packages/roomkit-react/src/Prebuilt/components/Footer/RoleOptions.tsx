import React, { useState } from 'react';
import { DefaultConferencingScreen_Elements } from '@100mslive/types-prebuilt';
import { HMSPeer, selectPermissions, useHMSActions, useHMSStore, useHMSVanillaStore } from '@100mslive/react-sdk';
import {
  MicOffIcon,
  MicOnIcon,
  PersonRectangleIcon,
  RemoveUserIcon,
  VerticalMenuIcon,
  VideoOffIcon,
  VideoOnIcon,
} from '@100mslive/react-icons';
import { Dropdown } from '../../../Dropdown';
import { Flex } from '../../../Layout';
import { Text } from '../../../Text';
import { useRoomLayoutConferencingScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
// @ts-ignore: No implicit Any
import { getMetadata } from '../../common/utils';

const dropdownItemCSS = { backgroundColor: '$surface_default', gap: '$4', p: '$8' };
const optionTextCSS = { fontWeight: '$semiBold', color: '$on_surface_high', textTransform: 'none' };

export const RoleOptions = ({ roleName, peerList }: { roleName: string; peerList: HMSPeer[] }) => {
  const [openOptions, setOpenOptions] = useState(false);
  const permissions = useHMSStore(selectPermissions);
  const hmsActions = useHMSActions();
  const { elements } = useRoomLayoutConferencingScreen();
  const { on_stage_role, off_stage_roles = [] } = (elements as DefaultConferencingScreen_Elements)?.on_stage_exp || {};

  const vanillaStore = useHMSVanillaStore();
  const store = vanillaStore.getState();

  let allPeersHaveVideoOn = true;
  let allPeersHaveAudioOn = true;

  peerList.forEach(peer => {
    const isAudioOn = !!peer.audioTrack && store.tracks[peer.audioTrack]?.enabled;
    const isVideoOn = !!peer.videoTrack && store.tracks[peer.videoTrack]?.enabled;
    allPeersHaveAudioOn = allPeersHaveAudioOn && isAudioOn;
    allPeersHaveVideoOn = allPeersHaveVideoOn && isVideoOn;
  });

  const canMuteRole = permissions?.mute && roleName === on_stage_role;
  const canRemoveRoleFromStage = permissions?.changeRole && roleName === on_stage_role;
  // on stage and off stage roles
  const canRemoveRoleFromRoom =
    permissions?.removeOthers && (on_stage_role === roleName || off_stage_roles?.includes(roleName));

  if (!(canMuteRole || canRemoveRoleFromStage || canRemoveRoleFromRoom) || peerList.length === 0) {
    return null;
  }

  const removeAllFromStage = () => {
    peerList.forEach(peer => {
      const prevRole = getMetadata(peer.metadata).prevRole;
      if (prevRole) {
        hmsActions.changeRoleOfPeer(peer.id, prevRole, true);
      }
    });
  };

  const setTrackEnabled = async (type: 'audio' | 'video', enabled = false) => {
    try {
      await hmsActions.setRemoteTracksEnabled({ roles: [roleName], source: 'regular', type, enabled });
    } catch (e) {
      console.error(e);
    }
  };

  const removePeersFromRoom = async () => {
    try {
      peerList.forEach(async peer => {
        await hmsActions.removePeer(peer.id, '');
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Dropdown.Root open={openOptions} onOpenChange={setOpenOptions}>
      <Dropdown.Trigger
        onClick={e => e.stopPropagation()}
        className="role_actions"
        asChild
        css={{
          p: '$1',
          r: '$0',
          c: '$on_surface_high',
          visibility: openOptions ? 'visible' : 'hidden',
          '&:hover': {
            c: '$on_surface_medium',
          },
          '@md': {
            visibility: 'visible',
          },
        }}
      >
        <Flex>
          <VerticalMenuIcon />
        </Flex>
      </Dropdown.Trigger>
      <Dropdown.Content
        onClick={e => e.stopPropagation()}
        css={{ w: 'max-content', maxWidth: '$64', bg: '$surface_default', py: 0 }}
        align="end"
      >
        {canRemoveRoleFromStage && (
          <Dropdown.Item
            css={{ ...dropdownItemCSS, borderBottom: '1px solid $border_bright' }}
            onClick={removeAllFromStage}
          >
            <PersonRectangleIcon />
            <Text variant="sm" css={optionTextCSS}>
              Remove all from Stage
            </Text>
          </Dropdown.Item>
        )}

        {canMuteRole && (
          <>
            <Dropdown.Item css={dropdownItemCSS} onClick={() => setTrackEnabled('audio', !allPeersHaveAudioOn)}>
              {allPeersHaveAudioOn ? <MicOffIcon /> : <MicOnIcon />}
              <Text variant="sm" css={optionTextCSS}>
                {allPeersHaveAudioOn ? 'Mute' : 'Unmute'} Audio
              </Text>
            </Dropdown.Item>

            <Dropdown.Item
              css={{ ...dropdownItemCSS, borderTop: '1px solid $border_bright' }}
              onClick={() => setTrackEnabled('video', !allPeersHaveVideoOn)}
            >
              {allPeersHaveVideoOn ? <VideoOffIcon /> : <VideoOnIcon />}
              <Text variant="sm" css={optionTextCSS}>
                {allPeersHaveVideoOn ? 'Mute' : 'Unmute'} Video
              </Text>
            </Dropdown.Item>
          </>
        )}

        {canRemoveRoleFromRoom && (
          <Dropdown.Item
            css={{ ...dropdownItemCSS, borderTop: '1px solid $border_bright', color: '$alert_error_default' }}
            onClick={removePeersFromRoom}
          >
            <RemoveUserIcon />
            <Text variant="sm" css={{ ...optionTextCSS, color: 'inherit' }}>
              Remove all from Room
            </Text>
          </Dropdown.Item>
        )}
      </Dropdown.Content>
    </Dropdown.Root>
  );
};

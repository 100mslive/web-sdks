import React, { useState } from 'react';
import { DefaultConferencingScreen_Elements } from '@100mslive/types-prebuilt';
import {
  HMSPeer,
  selectPermissions,
  selectRoleByRoleName,
  useHMSActions,
  useHMSStore,
  useHMSVanillaStore,
} from '@100mslive/react-sdk';
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

const MuteUnmuteOption = ({ roleName, peerList }: { peerList: HMSPeer[]; roleName: string }) => {
  const vanillaStore = useHMSVanillaStore();
  const store = vanillaStore.getState();
  const hmsActions = useHMSActions();
  const permissions = useHMSStore(selectPermissions);
  const role = useHMSStore(selectRoleByRoleName(roleName));

  let allPeersHaveVideoOn = true;
  let allPeersHaveAudioOn = true;

  peerList.forEach(peer => {
    if (peer.isLocal) {
      return;
    }
    const isAudioOn = !!peer.audioTrack && store.tracks[peer.audioTrack]?.enabled;
    const isVideoOn = !!peer.videoTrack && store.tracks[peer.videoTrack]?.enabled;
    allPeersHaveAudioOn = allPeersHaveAudioOn && isAudioOn;
    allPeersHaveVideoOn = allPeersHaveVideoOn && isVideoOn;
  });

  const setTrackEnabled = async (type: 'audio' | 'video', enabled = false) => {
    try {
      await hmsActions.setRemoteTracksEnabled({ roles: [roleName], source: 'regular', type, enabled });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      {role.publishParams.allowed?.includes('audio') && (
        <>
          {allPeersHaveAudioOn && permissions?.mute ? (
            <Dropdown.Item css={dropdownItemCSS} onClick={() => setTrackEnabled('audio', false)}>
              <MicOffIcon />
              <Text variant="sm" css={optionTextCSS}>
                Mute Audio for All
              </Text>
            </Dropdown.Item>
          ) : null}

          {!allPeersHaveAudioOn && permissions?.unmute ? (
            <Dropdown.Item css={dropdownItemCSS} onClick={() => setTrackEnabled('audio', true)}>
              <MicOnIcon />
              <Text variant="sm" css={optionTextCSS}>
                Unmute Audio for All
              </Text>
            </Dropdown.Item>
          ) : null}
        </>
      )}

      {role.publishParams.allowed?.includes('audio') && (
        <>
          {allPeersHaveVideoOn && permissions?.mute ? (
            <Dropdown.Item css={dropdownItemCSS} onClick={() => setTrackEnabled('video', false)}>
              <VideoOffIcon />
              <Text variant="sm" css={optionTextCSS}>
                Mute Video for All
              </Text>
            </Dropdown.Item>
          ) : null}

          {!allPeersHaveVideoOn && permissions?.unmute ? (
            <Dropdown.Item css={dropdownItemCSS} onClick={() => setTrackEnabled('video', true)}>
              <VideoOnIcon />
              <Text variant="sm" css={optionTextCSS}>
                Unmute Video for All
              </Text>
            </Dropdown.Item>
          ) : null}
        </>
      )}
    </>
  );
};

export const RoleOptions = ({ roleName, peerList }: { roleName: string; peerList: HMSPeer[] }) => {
  const [openOptions, setOpenOptions] = useState(false);
  const permissions = useHMSStore(selectPermissions);
  const hmsActions = useHMSActions();
  const { elements } = useRoomLayoutConferencingScreen();
  const { on_stage_role, off_stage_roles = [] } = (elements as DefaultConferencingScreen_Elements)?.on_stage_exp || {};
  const canMuteOrUnmute = permissions?.mute || permissions?.unmute;
  const canRemoveRoleFromStage = permissions?.changeRole && roleName === on_stage_role;
  // on stage and off stage roles
  const canRemoveRoleFromRoom =
    permissions?.removeOthers && (on_stage_role === roleName || off_stage_roles?.includes(roleName));

  if (!(canMuteOrUnmute || canRemoveRoleFromStage || canRemoveRoleFromRoom) || peerList.length === 0) {
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
        data-testid="role_group_options"
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

        {canMuteOrUnmute && <MuteUnmuteOption peerList={peerList} roleName={roleName} />}

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

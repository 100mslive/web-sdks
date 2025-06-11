import React, { useState } from 'react';
import { DefaultConferencingScreen_Elements } from '@100mslive/types-prebuilt';
import { match } from 'ts-pattern';
import {
  HMSPeer,
  selectPermissions,
  selectRoleByRoleName,
  selectTracksMap,
  useHMSActions,
  useHMSStore,
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
const optionTextCSS = {
  fontWeight: '$semiBold',
  color: '$on_surface_high',
  textTransform: 'none',
  whiteSpace: 'nowrap',
};

const DropdownWrapper = ({ children }: { children: React.ReactNode }) => {
  const [openOptions, setOpenOptions] = useState(false);
  if (React.Children.toArray(children).length === 0) {
    return null;
  }
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
        css={{ w: 'max-content', bg: '$surface_default', py: 0 }}
        align="end"
      >
        {children}
      </Dropdown.Content>
    </Dropdown.Root>
  );
};

export const RoleOptions = ({ roleName, peerList }: { roleName: string; peerList: HMSPeer[] }) => {
  const permissions = useHMSStore(selectPermissions);
  const hmsActions = useHMSActions();
  const { elements } = useRoomLayoutConferencingScreen();
  const { on_stage_role, off_stage_roles = [] } = (elements as DefaultConferencingScreen_Elements)?.on_stage_exp || {};
  const canRemoveRoleFromStage = permissions?.changeRole && roleName === on_stage_role;
  const role = useHMSStore(selectRoleByRoleName(roleName));
  const tracks = useHMSStore(selectTracksMap);
  if (!role) {
    return null;
  }
  const canPublishAudio = role.publishParams.allowed.includes('audio');
  const canPublishVideo = role.publishParams.allowed.includes('video');

  let isVideoOnForSomePeers = false;
  let isAudioOnForSomePeers = false;

  peerList.forEach(peer => {
    if (peer.isLocal) {
      return;
    }
    const isAudioOn = !!peer.audioTrack && tracks[peer.audioTrack]?.enabled;
    const isVideoOn = !!peer.videoTrack && tracks[peer.videoTrack]?.enabled;
    isAudioOnForSomePeers = isAudioOnForSomePeers || isAudioOn;
    isVideoOnForSomePeers = isVideoOnForSomePeers || isVideoOn;
  });

  const setTrackEnabled = async (type: 'audio' | 'video', enabled = false) => {
    try {
      await hmsActions.setRemoteTracksEnabled({ roles: [roleName], source: 'regular', type, enabled });
    } catch (e) {
      console.error(e);
    }
  };

  // on stage and off stage roles
  const canRemoveRoleFromRoom =
    permissions?.removeOthers && (on_stage_role === roleName || off_stage_roles?.includes(roleName));

  if (
    peerList.length === 0 ||
    // if only local peer is present no need to show any options
    (peerList.length === 1 && peerList[0].isLocal) ||
    !role
  ) {
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
    <DropdownWrapper>
      {canRemoveRoleFromStage ? (
        <Dropdown.Item
          css={{ ...dropdownItemCSS, borderBottom: '1px solid $border_bright' }}
          onClick={removeAllFromStage}
        >
          <PersonRectangleIcon />
          <Text variant="sm" css={optionTextCSS}>
            Remove all from Stage
          </Text>
        </Dropdown.Item>
      ) : null}

      {match({ canPublishAudio, isAudioOnForSomePeers, canMute: permissions?.mute, canUnmute: permissions?.unmute })
        .with({ canPublishAudio: true, isAudioOnForSomePeers: true, canMute: true }, () => {
          return (
            <Dropdown.Item css={dropdownItemCSS} onClick={() => setTrackEnabled('audio', false)}>
              <MicOffIcon />
              <Text variant="sm" css={optionTextCSS}>
                Mute Audio for All
              </Text>
            </Dropdown.Item>
          );
        })
        .with({ canPublishAudio: true, isAudioOnForSomePeers: false, canUnmute: true }, () => {
          return (
            <Dropdown.Item css={dropdownItemCSS} onClick={() => setTrackEnabled('audio', true)}>
              <MicOnIcon />
              <Text variant="sm" css={optionTextCSS}>
                Request to Unmute Audio for All
              </Text>
            </Dropdown.Item>
          );
        })
        .otherwise(() => null)}
      {match({ canPublishVideo, isVideoOnForSomePeers, canMute: permissions?.mute, canUnmute: permissions?.unmute })
        .with({ canPublishVideo: true, isVideoOnForSomePeers: true, canMute: true }, () => {
          return (
            <Dropdown.Item css={dropdownItemCSS} onClick={() => setTrackEnabled('video', false)}>
              <VideoOffIcon />
              <Text variant="sm" css={optionTextCSS}>
                Turn Off Video for All
              </Text>
            </Dropdown.Item>
          );
        })
        .with({ canPublishVideo: true, isVideoOnForSomePeers: false, canUnmute: true }, () => {
          return (
            <Dropdown.Item css={dropdownItemCSS} onClick={() => setTrackEnabled('video', true)}>
              <VideoOnIcon />
              <Text variant="sm" css={optionTextCSS}>
                Request to Turn On Video for All
              </Text>
            </Dropdown.Item>
          );
        })
        .otherwise(() => null)}

      {canRemoveRoleFromRoom ? (
        <Dropdown.Item
          css={{ ...dropdownItemCSS, borderTop: '1px solid $border_bright', color: '$alert_error_default' }}
          onClick={removePeersFromRoom}
        >
          <RemoveUserIcon />
          <Text variant="sm" css={{ ...optionTextCSS, color: 'inherit' }}>
            Remove all from Room
          </Text>
        </Dropdown.Item>
      ) : null}
    </DropdownWrapper>
  );
};

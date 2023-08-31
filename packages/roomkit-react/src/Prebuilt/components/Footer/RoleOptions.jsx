import React, { useState } from 'react';
import { selectPermissions, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
import {
  MicOffIcon,
  PersonRectangleIcon,
  RemoveUserIcon,
  VerticalMenuIcon,
  VideoOffIcon,
} from '@100mslive/react-icons';
import { Dropdown } from '../../../Dropdown';
import { Flex } from '../../../Layout';
import { Text } from '../../../Text';
import { useStageDetails } from '../../common/hooks';

const dropdownItemCSS = { backgroundColor: '$surface_default', gap: '$4', p: '$8' };
const optionTextCSS = { fontWeight: '$semiBold', color: '$on_surface_high', textTransform: 'none' };

export const RoleOptions = ({ roleName, peerIDList }) => {
  const [openOptions, setOpenOptions] = useState(false);
  const permissions = useHMSStore(selectPermissions);
  const hmsActions = useHMSActions();
  const stageDetails = useStageDetails();

  const canMuteRole = permissions.mute && roleName === stageDetails?.on_stage_role;

  const canRemoveRoleFromStage = permissions.changeRole && roleName === stageDetails?.on_stage_role;

  // on stage and off stage roles
  const canRemoveRoleFromRoom =
    permissions.removeOthers &&
    (stageDetails?.on_stage_role === roleName || stageDetails?.off_stage_roles?.includes(roleName));

  if (!(canMuteRole || canRemoveRoleFromStage || canRemoveRoleFromRoom)) {
    return null;
  }

  const setTrackEnabled = async (type, enabled = false) => {
    try {
      await hmsActions.setRemoteTracksEnabled({ roles: [roleName], source: 'regular', type, enabled });
    } catch (e) {
      console.error(e);
    }
  };

  const removeRoleFromRoom = async () => {
    try {
      peerIDList.forEach(async peerID => {
        await hmsActions.removePeer(peerID, '');
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
            css={dropdownItemCSS}
            onClick={() => {
              hmsActions.changeRoleOfPeersWithRoles([stageDetails.on_stage_role], stageDetails.off_stage_roles[0]);
            }}
          >
            <PersonRectangleIcon />
            <Text variant="sm" css={optionTextCSS}>
              Remove all from Stage
            </Text>
          </Dropdown.Item>
        )}

        {canMuteRole && (
          <>
            <Dropdown.Item
              css={{ ...dropdownItemCSS, borderTop: '1px solid $border_bright' }}
              onClick={() => setTrackEnabled('audio')}
            >
              <MicOffIcon />
              <Text variant="sm" css={optionTextCSS}>
                Mute Audio
              </Text>
            </Dropdown.Item>

            <Dropdown.Item
              css={{ ...dropdownItemCSS, borderTop: '1px solid $border_bright' }}
              onClick={() => setTrackEnabled('video')}
            >
              <VideoOffIcon />
              <Text variant="sm" css={optionTextCSS}>
                Mute Video
              </Text>
            </Dropdown.Item>
          </>
        )}

        {canRemoveRoleFromRoom && (
          <Dropdown.Item
            css={{ ...dropdownItemCSS, borderTop: '1px solid $border_bright', color: '$alert_error_default' }}
            onClick={removeRoleFromRoom}
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

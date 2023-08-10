import React, { Fragment, useState } from 'react';
import Hls from 'hls.js';
import {
  selectAppData,
  selectIsAllowedToPublish,
  selectLocalPeerID,
  selectLocalPeerRoleName,
  selectPermissions,
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';
import {
  BrbIcon,
  CheckIcon,
  CrossIcon,
  DragHandleIcon,
  HandIcon,
  InfoIcon,
  MicOffIcon,
  PencilIcon,
  PipIcon,
  SettingsIcon,
} from '@100mslive/react-icons';
import { Box, Checkbox, Dropdown, Flex, Text, Tooltip } from '../../../';
import IconButton from '../../IconButton';
import { PIP } from '../PIP';
import { RoleChangeModal } from '../RoleChangeModal';
import SettingsModal from '../Settings/SettingsModal';
import StartRecording from '../Settings/StartRecording';
import { StatsForNerds } from '../StatsForNerds';
import { BulkRoleChangeModal } from './BulkRoleChangeModal';
import { ChangeNameModal } from './ChangeNameModal';
import { ChangeSelfRole } from './ChangeSelfRole';
import { EmbedUrl, EmbedUrlModal } from './EmbedUrl';
import { FullScreenItem } from './FullScreenItem';
import { MuteAllModal } from './MuteAllModal';
import { useDropdownList } from '../hooks/useDropdownList';
import { useIsFeatureEnabled } from '../hooks/useFeatures';
import { useMyMetadata } from '../hooks/useMetadata';
import { FeatureFlags } from '../../services/FeatureFlags';
import { APP_DATA, FEATURE_LIST, isMacOS } from '../../common/constants';
import { useMedia } from 'react-use';
import { config as cssConfig } from '../../../';
import { Sheet } from '../../../Sheet';
import { ActionTile } from './ActionTile';

const MODALS = {
  CHANGE_NAME: 'changeName',
  SELF_ROLE_CHANGE: 'selfRoleChange',
  MORE_SETTINGS: 'moreSettings',
  START_RECORDING: 'startRecording',
  DEVICE_SETTINGS: 'deviceSettings',
  STATS_FOR_NERDS: 'statsForNerds',
  BULK_ROLE_CHANGE: 'bulkRoleChange',
  MUTE_ALL: 'muteAll',
  EMBED_URL: 'embedUrl',
};

export const MoreSettings = ({ showStreamingUI = false }) => {
  const permissions = useHMSStore(selectPermissions);
  const isAllowedToPublish = useHMSStore(selectIsAllowedToPublish);
  const localPeerId = useHMSStore(selectLocalPeerID);
  const localPeerRole = useHMSStore(selectLocalPeerRoleName);
  const hmsActions = useHMSActions();
  const enablHlsStats = useHMSStore(selectAppData(APP_DATA.hlsStats));
  const isChangeNameEnabled = useIsFeatureEnabled(FEATURE_LIST.CHANGE_NAME);
  const isEmbedEnabled = useIsFeatureEnabled(FEATURE_LIST.EMBED_URL);
  const isSFNEnabled = useIsFeatureEnabled(FEATURE_LIST.STARTS_FOR_NERDS);
  const [openModals, setOpenModals] = useState(new Set());
  const { isHandRaised, isBRBOn, toggleHandRaise, toggleBRB } = useMyMetadata();
  const isHandRaiseEnabled = useIsFeatureEnabled(FEATURE_LIST.HAND_RAISE);
  const isBRBEnabled = useIsFeatureEnabled(FEATURE_LIST.BRB);
  const isPIPEnabled = useIsFeatureEnabled(FEATURE_LIST.PICTURE_IN_PICTURE);
  const [openSettingsSheet, setOpenSettingsSheet] = useState(false);

  useDropdownList({ open: openModals.size > 0, name: 'MoreSettings' });

  const updateState = (modalName, value) => {
    setOpenModals(modals => {
      const copy = new Set(modals);
      if (value) {
        copy.add(modalName);
      } else {
        copy.delete(modalName);
      }
      return copy;
    });
  };
  const isMobile = useMedia(cssConfig.media.md);

  if (isMobile) {
    return (
      <>
        <Sheet.Root open={openSettingsSheet} onOpenChange={setOpenSettingsSheet}>
          <Sheet.Trigger asChild data-testid="more_settings_btn">
            <IconButton>
              <Tooltip title="More options">
                <Box>
                  <DragHandleIcon />
                </Box>
              </Tooltip>
            </IconButton>
          </Sheet.Trigger>
          <Sheet.Content css={{ bg: '$surface_dim', pb: '$14' }}>
            <Sheet.Title
              css={{
                display: 'flex',
                color: '$on_surface_high',
                w: '100%',
                justifyContent: 'space-between',
                fontSize: '$md',
                mt: '$8',
                px: '$10',
                pb: '$8',
                borderBottom: '1px solid $border_default',
                mb: '$8',
              }}
            >
              Options
              <Sheet.Close>
                <Box css={{ color: '$on_surface_high' }}>
                  <CrossIcon />
                </Box>
              </Sheet.Close>
            </Sheet.Title>
            <Box
              css={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gridTemplateRows: 'auto',
                gridColumnGap: '$6',
                gridRowGap: '$8',
                px: '$9',
              }}
            >
              {isHandRaiseEnabled ? (
                <ActionTile
                  title="Raise Hand"
                  icon={<HandIcon />}
                  onClick={toggleHandRaise}
                  active={isHandRaised}
                  setOpenSettingsSheet={setOpenSettingsSheet}
                />
              ) : null}
              {isBRBEnabled ? (
                <ActionTile
                  title="Be Right Back"
                  icon={<BrbIcon />}
                  onClick={toggleBRB}
                  active={isBRBOn}
                  setOpenSettingsSheet={setOpenSettingsSheet}
                />
              ) : null}
              {permissions.mute ? (
                <ActionTile
                  title="Mute All"
                  icon={<MicOffIcon />}
                  onClick={() => updateState(MODALS.MUTE_ALL, true)}
                  setOpenSettingsSheet={setOpenSettingsSheet}
                />
              ) : null}
              <ActionTile
                title="Change Name"
                icon={<PencilIcon />}
                onClick={() => updateState(MODALS.CHANGE_NAME, true)}
                setOpenSettingsSheet={setOpenSettingsSheet}
              />
            </Box>
          </Sheet.Content>
        </Sheet.Root>
        {openModals.has(MODALS.MUTE_ALL) && (
          <MuteAllModal onOpenChange={value => updateState(MODALS.MUTE_ALL, value)} />
        )}
        {openModals.has(MODALS.CHANGE_NAME) && (
          <ChangeNameModal onOpenChange={value => updateState(MODALS.CHANGE_NAME, value)} />
        )}
      </>
    );
  }

  return (
    <Fragment>
      <Dropdown.Root
        open={openModals.has(MODALS.MORE_SETTINGS)}
        onOpenChange={value => updateState(MODALS.MORE_SETTINGS, value)}
      >
        <Dropdown.Trigger asChild data-testid="more_settings_btn">
          <IconButton>
            <Tooltip title="More options">
              <Box>
                <DragHandleIcon />
              </Box>
            </Tooltip>
          </IconButton>
        </Dropdown.Trigger>

        <Dropdown.Content
          sideOffset={5}
          align="end"
          css={{
            py: '$0',
            maxHeight: 'unset',
            '@md': { w: '$64' },
            "div[role='separator']:first-child": {
              display: 'none',
            },
          }}
        >
          {isHandRaiseEnabled && !showStreamingUI ? (
            <Dropdown.Item onClick={toggleHandRaise} data-testid="raise_hand_btn">
              <HandIcon />
              <Text variant="sm" css={{ ml: '$4', color: '$on_surface_high' }}>
                Raise Hand
              </Text>
              <Flex justify="end" css={{ color: '$on_surface_high', flexGrow: '1' }}>
                {isHandRaised ? <CheckIcon /> : null}
              </Flex>
            </Dropdown.Item>
          ) : null}

          {isBRBEnabled && !showStreamingUI ? (
            <Dropdown.Item onClick={toggleBRB} data-testid="brb_btn">
              <BrbIcon />
              <Text variant="sm" css={{ ml: '$4', color: '$on_surface_high' }}>
                Be Right Back
              </Text>
              <Flex justify="end" css={{ color: '$on_surface_high', flexGrow: '1' }}>
                {isBRBOn ? <CheckIcon /> : null}
              </Flex>
            </Dropdown.Item>
          ) : null}

          {(isBRBEnabled || isHandRaiseEnabled) && !showStreamingUI ? (
            <Dropdown.ItemSeparator css={{ mx: '0' }} />
          ) : null}

          {isPIPEnabled ? (
            <Dropdown.Item>
              <PIP
                content={
                  <Flex css={{ w: '100%' }}>
                    <PipIcon />
                    <Text variant="sm" css={{ ml: '$4' }}>
                      Picture in picture mode
                    </Text>
                  </Flex>
                }
              />
            </Dropdown.Item>
          ) : null}

          {isChangeNameEnabled && (
            <Dropdown.Item onClick={() => updateState(MODALS.CHANGE_NAME, true)} data-testid="change_name_btn">
              <PencilIcon />
              <Text variant="sm" css={{ ml: '$4' }}>
                Change Name
              </Text>
            </Dropdown.Item>
          )}
          <ChangeSelfRole onClick={() => updateState(MODALS.SELF_ROLE_CHANGE, true)} />
          <FullScreenItem />
          {isAllowedToPublish.screen && isEmbedEnabled && (
            <EmbedUrl setShowOpenUrl={() => updateState(MODALS.EMBED_URL, true)} />
          )}

          {permissions.mute && (
            <Dropdown.Item onClick={() => updateState(MODALS.MUTE_ALL, true)} data-testid="mute_all_btn">
              <MicOffIcon />
              <Text variant="sm" css={{ ml: '$4' }}>
                Mute All
              </Text>
            </Dropdown.Item>
          )}
          <Dropdown.ItemSeparator css={{ mx: 0 }} />

          <Dropdown.Item onClick={() => updateState(MODALS.DEVICE_SETTINGS, true)} data-testid="device_settings_btn">
            <SettingsIcon />
            <Text variant="sm" css={{ ml: '$4' }}>
              Settings
            </Text>
          </Dropdown.Item>

          {FeatureFlags.enableStatsForNerds &&
            isSFNEnabled &&
            (localPeerRole === 'hls-viewer' ? (
              Hls.isSupported() ? (
                <Dropdown.Item
                  onClick={() => hmsActions.setAppData(APP_DATA.hlsStats, !enablHlsStats)}
                  data-testid="hls_stats"
                >
                  <Checkbox.Root
                    css={{ margin: '$2' }}
                    checked={enablHlsStats}
                    onCheckedChange={() => hmsActions.setAppData(APP_DATA.hlsStats, !enablHlsStats)}
                  >
                    <Checkbox.Indicator>
                      <CheckIcon width={16} height={16} />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  <Flex justify="between" css={{ width: '100%' }}>
                    <Text variant="sm" css={{ ml: '$4' }}>
                      Show HLS Stats
                    </Text>

                    <Text variant="sm" css={{ ml: '$4' }}>
                      {`${isMacOS ? '⌘' : 'ctrl'} + ]`}
                    </Text>
                  </Flex>
                </Dropdown.Item>
              ) : null
            ) : (
              <Dropdown.Item
                onClick={() => updateState(MODALS.STATS_FOR_NERDS, true)}
                data-testid="stats_for_nreds_btn"
              >
                <InfoIcon />
                <Text variant="sm" css={{ ml: '$4' }}>
                  Stats for Nerds
                </Text>
              </Dropdown.Item>
            ))}
        </Dropdown.Content>
      </Dropdown.Root>
      {openModals.has(MODALS.BULK_ROLE_CHANGE) && (
        <BulkRoleChangeModal onOpenChange={value => updateState(MODALS.BULK_ROLE_CHANGE, value)} />
      )}
      {openModals.has(MODALS.MUTE_ALL) && <MuteAllModal onOpenChange={value => updateState(MODALS.MUTE_ALL, value)} />}
      {openModals.has(MODALS.CHANGE_NAME) && (
        <ChangeNameModal onOpenChange={value => updateState(MODALS.CHANGE_NAME, value)} />
      )}
      {openModals.has(MODALS.START_RECORDING) && (
        <StartRecording open onOpenChange={value => updateState(MODALS.START_RECORDING, value)} />
      )}
      {openModals.has(MODALS.DEVICE_SETTINGS) && (
        <SettingsModal open onOpenChange={value => updateState(MODALS.DEVICE_SETTINGS, value)} />
      )}
      {FeatureFlags.enableStatsForNerds && openModals.has(MODALS.STATS_FOR_NERDS) && (
        <StatsForNerds open onOpenChange={value => updateState(MODALS.STATS_FOR_NERDS, value)} />
      )}
      {openModals.has(MODALS.SELF_ROLE_CHANGE) && (
        <RoleChangeModal peerId={localPeerId} onOpenChange={value => updateState(MODALS.SELF_ROLE_CHANGE, value)} />
      )}
      {openModals.has(MODALS.EMBED_URL) && (
        <EmbedUrlModal onOpenChange={value => updateState(MODALS.EMBED_URL, value)} />
      )}
    </Fragment>
  );
};

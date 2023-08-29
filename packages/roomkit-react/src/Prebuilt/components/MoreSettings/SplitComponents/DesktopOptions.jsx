import React, { Fragment, useState } from 'react';
import { HMSHLSPlayer } from '@100mslive/hls-player';
import { selectAppData, selectLocalPeerID, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
import { BrbIcon, CheckIcon, DragHandleIcon, HandIcon, InfoIcon, PipIcon, SettingsIcon } from '@100mslive/react-icons';
import { Checkbox, Dropdown, Flex, Text, Tooltip } from '../../../../';
import IconButton from '../../../IconButton';
import { PIP } from '../../PIP';
import { PictureInPicture } from '../../PIP/PIPManager';
import { RoleChangeModal } from '../../RoleChangeModal';
import SettingsModal from '../../Settings/SettingsModal';
import StartRecording from '../../Settings/StartRecording';
import { StatsForNerds } from '../../StatsForNerds';
import { BulkRoleChangeModal } from '.././BulkRoleChangeModal';
import { FullScreenItem } from '.././FullScreenItem';
import { MuteAllModal } from '.././MuteAllModal';
import { useDropdownList } from '../../hooks/useDropdownList';
import { useMyMetadata } from '../../hooks/useMetadata';
import { useShowStreamingUI } from '../../../common/hooks';
import { FeatureFlags } from '../../../services/FeatureFlags';
import { APP_DATA, isMacOS } from '../../../common/constants';

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

export const DesktopOptions = ({ isHLSViewer }) => {
  const localPeerId = useHMSStore(selectLocalPeerID);
  const hmsActions = useHMSActions();
  const enablHlsStats = useHMSStore(selectAppData(APP_DATA.hlsStats));
  const [openModals, setOpenModals] = useState(new Set());
  const { isHandRaised, isBRBOn, toggleHandRaise, toggleBRB } = useMyMetadata();
  const showStreamingUI = useShowStreamingUI();
  const isPipOn = PictureInPicture.isOn();

  useDropdownList({ open: openModals.size > 0, name: 'MoreSettings' });

  const updateState = (modalName, value) => {
    setOpenModals(modals => {
      const copy = new Set(modals);
      if (value) {
        // avoiding extra set state trigger which removes currently open dialog by clearing set.
        copy.clear();
        copy.add(modalName);
      } else {
        copy.delete(modalName);
      }
      return copy;
    });
  };

  return (
    <Fragment>
      <Dropdown.Root
        open={openModals.has(MODALS.MORE_SETTINGS)}
        onOpenChange={value => updateState(MODALS.MORE_SETTINGS, value)}
        modal={false}
      >
        <Dropdown.Trigger asChild data-testid="more_settings_btn">
          <IconButton>
            <Tooltip title="More options">
              <DragHandleIcon />
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
          {!(showStreamingUI || isHLSViewer) ? (
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

          {!(showStreamingUI || isHLSViewer) ? (
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

          {!(showStreamingUI || isHLSViewer) ? <Dropdown.ItemSeparator css={{ mx: '0' }} /> : null}

          {!isHLSViewer ? (
            <Dropdown.Item>
              <PIP
                content={
                  <Flex css={{ w: '100%' }}>
                    <PipIcon />
                    <Text variant="sm" css={{ ml: '$4' }}>
                      {isPipOn ? 'Disable' : 'Enable'} Picture-in-Picture
                    </Text>
                  </Flex>
                }
              />
            </Dropdown.Item>
          ) : null}

          <FullScreenItem />
          {/* {isAllowedToPublish.screen && isEmbedEnabled && (
            <EmbedUrl setShowOpenUrl={() => updateState(MODALS.EMBED_URL, true)} />
          )} */}

          <Dropdown.ItemSeparator css={{ mx: 0 }} />

          <Dropdown.Item onClick={() => updateState(MODALS.DEVICE_SETTINGS, true)} data-testid="device_settings_btn">
            <SettingsIcon />
            <Text variant="sm" css={{ ml: '$4' }}>
              Settings
            </Text>
          </Dropdown.Item>

          {FeatureFlags.enableStatsForNerds &&
            (isHLSViewer ? (
              HMSHLSPlayer.isSupported() ? (
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
      {/* {openModals.has(MODALS.EMBED_URL) && (
        <EmbedUrlModal onOpenChange={value => updateState(MODALS.EMBED_URL, value)} />
      )} */}
    </Fragment>
  );
};

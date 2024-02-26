import React, { Fragment, useState } from 'react';
import { HMSHLSPlayer } from '@100mslive/hls-player';
import {
  ConferencingScreen,
  DefaultConferencingScreen_Elements,
  HLSLiveStreamingScreen_Elements,
} from '@100mslive/types-prebuilt';
import { selectAppData, selectLocalPeerID, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
import { BrbIcon, CheckIcon, HamburgerMenuIcon, InfoIcon, PipIcon, SettingsIcon } from '@100mslive/react-icons';
import { Checkbox, Dropdown, Flex, Text, Tooltip } from '../../../..';
import IconButton from '../../../IconButton';
// @ts-ignore: No implicit any
import { PIP } from '../../PIP';
// @ts-ignore: No implicit any
import { PictureInPicture } from '../../PIP/PIPManager';
// @ts-ignore: No implicit any
import { RoleChangeModal } from '../../RoleChangeModal';
// @ts-ignore: No implicit any
import SettingsModal from '../../Settings/SettingsModal';
// @ts-ignore: No implicit any
import StartRecording from '../../Settings/StartRecording';
// @ts-ignore: No implicit any
import { StatsForNerds } from '../../StatsForNerds';
// @ts-ignore: No implicit any
import { BulkRoleChangeModal } from '../BulkRoleChangeModal';
// @ts-ignore: No implicit any
import { FullScreenItem } from '../FullScreenItem';
import { MuteAllModal } from '../MuteAllModal';
// @ts-ignore: No implicit any
import { useDropdownList } from '../../hooks/useDropdownList';
// @ts-ignore: No implicit any
import { useMyMetadata } from '../../hooks/useMetadata';
// @ts-ignore: No implicit any
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

export const DesktopOptions = ({
  elements,
  screenType,
}: {
  elements: DefaultConferencingScreen_Elements & HLSLiveStreamingScreen_Elements;
  screenType: keyof ConferencingScreen;
}) => {
  const localPeerId = useHMSStore(selectLocalPeerID);
  const hmsActions = useHMSActions();
  const enablHlsStats = useHMSStore(selectAppData(APP_DATA.hlsStats));
  const [openModals, setOpenModals] = useState(new Set());
  const { isBRBOn, toggleBRB } = useMyMetadata();
  const isPipOn = PictureInPicture.isOn();
  const isBRBEnabled = !!elements?.brb;

  useDropdownList({ open: openModals.size > 0, name: 'MoreSettings' });

  const updateState = (modalName: string, value: boolean) => {
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
        <Tooltip title="More options">
          <Dropdown.Trigger asChild data-testid="more_settings_btn">
            <IconButton>
              <HamburgerMenuIcon />
            </IconButton>
          </Dropdown.Trigger>
        </Tooltip>

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
          {isBRBEnabled && screenType !== 'hls_live_streaming' ? (
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

          {screenType !== 'hls_live_streaming' ? (
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

          {screenType === 'hls_live_streaming' ? (
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
            <Dropdown.Item onClick={() => updateState(MODALS.STATS_FOR_NERDS, true)} data-testid="stats_for_nreds_btn">
              <InfoIcon />
              <Text variant="sm" css={{ ml: '$4' }}>
                Stats for Nerds
              </Text>
            </Dropdown.Item>
          )}
        </Dropdown.Content>
      </Dropdown.Root>
      {openModals.has(MODALS.BULK_ROLE_CHANGE) && (
        <BulkRoleChangeModal onOpenChange={(value: boolean) => updateState(MODALS.BULK_ROLE_CHANGE, value)} />
      )}
      {openModals.has(MODALS.MUTE_ALL) && (
        <MuteAllModal onOpenChange={(value: boolean) => updateState(MODALS.MUTE_ALL, value)} />
      )}

      {openModals.has(MODALS.START_RECORDING) && (
        <StartRecording open onOpenChange={(value: boolean) => updateState(MODALS.START_RECORDING, value)} />
      )}
      {openModals.has(MODALS.DEVICE_SETTINGS) && (
        <SettingsModal
          open
          onOpenChange={(value: boolean) => updateState(MODALS.DEVICE_SETTINGS, value)}
          screenType={screenType}
        />
      )}
      {openModals.has(MODALS.STATS_FOR_NERDS) && (
        <StatsForNerds open onOpenChange={(value: boolean) => updateState(MODALS.STATS_FOR_NERDS, value)} />
      )}
      {openModals.has(MODALS.SELF_ROLE_CHANGE) && (
        <RoleChangeModal
          peerId={localPeerId}
          onOpenChange={(value: boolean) => updateState(MODALS.SELF_ROLE_CHANGE, value)}
        />
      )}
      {/* {openModals.has(MODALS.EMBED_URL) && (
        <EmbedUrlModal onOpenChange={value => updateState(MODALS.EMBED_URL, value)} />
      )} */}
    </Fragment>
  );
};

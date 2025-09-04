import React, { Fragment, useState } from 'react';
import { HMSHLSPlayer } from '@100mslive/hls-player';
import {
  ConferencingScreen,
  DefaultConferencingScreen_Elements,
  HLSLiveStreamingScreen_Elements,
} from '@100mslive/types-prebuilt';
import { match } from 'ts-pattern';
import {
  HMSTranscriptionMode,
  selectAppData,
  selectIsTranscriptionAllowedByMode,
  selectIsTranscriptionEnabled,
  selectLocalPeerID,
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';
import {
  BrbIcon,
  CheckIcon,
  HamburgerMenuIcon,
  InfoIcon,
  OpenCaptionIcon,
  PipIcon,
  SettingsIcon,
} from '@100mslive/react-icons';
import { Checkbox, Dropdown, Flex, Switch, Text, Tooltip } from '../../../..';
import IconButton from '../../../IconButton';
// @ts-ignore: No implicit any
import { PIP } from '../../PIP';
import { PIPChat } from '../../PIP/PIPChat';
// @ts-ignore: No implicit any
import { PIPChatOption } from '../../PIP/PIPChatOption';
import { PictureInPicture } from '../../PIP/PIPManager';
import { PIPWindow } from '../../PIP/PIPWindow';
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
import { CaptionModal } from '../CaptionModal';
// @ts-ignore: No implicit any
import { FullScreenItem } from '../FullScreenItem';
import { MuteAllModal } from '../MuteAllModal';
// @ts-ignore: No implicit any
import { useIsSidepaneTypeOpen, useSidepaneToggle } from '../../AppData/useSidepane';
// @ts-ignore: No implicit any
import { useDropdownList } from '../../hooks/useDropdownList';
import { useMyMetadata } from '../../hooks/useMetadata';
// @ts-ignore: No implicit any
import { usePIPChat } from '../../PIP/usePIPChat';
// @ts-ignore: No implicit any
import { APP_DATA, isMacOS, SIDE_PANE_OPTIONS } from '../../../common/constants';

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
  CAPTION: 'caption',
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
  const isTranscriptionAllowed = useHMSStore(selectIsTranscriptionAllowedByMode(HMSTranscriptionMode.CAPTION));
  const isTranscriptionEnabled = useHMSStore(selectIsTranscriptionEnabled);
  const { isSupported, pipWindow, requestPipWindow } = usePIPChat();
  const isChatOpen = useIsSidepaneTypeOpen(SIDE_PANE_OPTIONS.CHAT);
  const toggleChat = useSidepaneToggle(SIDE_PANE_OPTIONS.CHAT);
  // Hide if pip chat is already open
  const showPipChatOption = !!elements?.chat && isSupported && !pipWindow;

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
      {isSupported && pipWindow ? (
        <PIPWindow pipWindow={pipWindow}>
          <PIPChat />
        </PIPWindow>
      ) : null}
      <Dropdown.Root
        open={openModals.has(MODALS.MORE_SETTINGS)}
        onOpenChange={(value: boolean) => updateState(MODALS.MORE_SETTINGS, value)}
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
          onCloseAutoFocus={e => {
            e.preventDefault();
          }}
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
          {isTranscriptionAllowed ? (
            <Dropdown.Item
              data-testid="closed_caption_admin"
              onClick={() => {
                updateState(MODALS.CAPTION, true);
              }}
            >
              <OpenCaptionIcon />
              <Flex direction="column" css={{ flexGrow: '1' }}>
                <Text variant="sm" css={{ ml: '$4', color: '$on_surface_high' }}>
                  Closed Captions
                </Text>
                <Text variant="caption" css={{ ml: '$4', color: '$on_surface_medium' }}>
                  {isTranscriptionEnabled ? 'Enabled' : 'Disabled'}
                </Text>
              </Flex>
              <Switch id="closed_caption_start_stop" checked={isTranscriptionEnabled} disabled={false} />
            </Dropdown.Item>
          ) : null}
          {screenType !== 'hls_live_streaming' ? (
            <Dropdown.Item css={{ p: 0, '&:empty': { display: 'none' } }}>
              <PIP
                content={
                  <Flex css={{ w: '100%', h: '100%', p: '$8' }}>
                    <PipIcon />
                    <Text variant="sm" css={{ ml: '$4' }}>
                      {isPipOn ? 'Disable' : 'Enable'} Picture-in-Picture
                    </Text>
                  </Flex>
                }
              />
            </Dropdown.Item>
          ) : null}

          <PIPChatOption
            showPIPChat={showPipChatOption}
            openChat={async () => {
              isChatOpen && toggleChat();
              await requestPipWindow(350, 500);
            }}
          />
          <FullScreenItem />
          <Dropdown.ItemSeparator css={{ mx: 0 }} />
          <Dropdown.Item onClick={() => updateState(MODALS.DEVICE_SETTINGS, true)} data-testid="device_settings_btn">
            <SettingsIcon />
            <Text variant="sm" css={{ ml: '$4' }}>
              Settings
            </Text>
          </Dropdown.Item>
          {match({ screenType, isSupported: HMSHLSPlayer.isSupported() })
            .with({ screenType: 'hls_live_streaming', isSupported: false }, () => null)
            .with({ screenType: 'hls_live_streaming', isSupported: true }, () => {
              return (
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
              );
            })
            .otherwise(() => (
              <Dropdown.Item
                onClick={() => updateState(MODALS.STATS_FOR_NERDS, true)}
                data-testid="stats_for_nerds_btn"
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
      {openModals.has(MODALS.CAPTION) && (
        <CaptionModal onOpenChange={(value: boolean) => updateState(MODALS.CAPTION, value)} />
      )}
      {/* {openModals.has(MODALS.EMBED_URL) && (
        <EmbedUrlModal onOpenChange={(value: boolean) => updateState(MODALS.EMBED_URL, value)} />
      )} */}
    </Fragment>
  );
};

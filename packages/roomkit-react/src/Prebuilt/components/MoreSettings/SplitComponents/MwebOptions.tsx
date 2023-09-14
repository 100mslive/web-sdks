import React, { useRef, useState } from 'react';
import { useClickAway } from 'react-use';
import { ConferencingScreen, DefaultConferencingScreen_Elements } from '@100mslive/types-prebuilt';
import {
  selectIsConnectedToRoom,
  selectPeerCount,
  selectPermissions,
  useAVToggle,
  useHMSActions,
  useHMSStore,
  useRecordingStreaming,
} from '@100mslive/react-sdk';
import {
  BrbIcon,
  CrossIcon,
  DragHandleIcon,
  EmojiIcon,
  HandIcon,
  HandRaiseSlashedIcon,
  PeopleIcon,
  RecordIcon,
  SettingsIcon,
} from '@100mslive/react-icons';
import { Box, Loading, Tooltip } from '../../../..';
import { Sheet } from '../../../../Sheet';
// @ts-ignore: No implicit any
import IconButton from '../../../IconButton';
// @ts-ignore: No implicit any
import { EmojiReaction } from '../../EmojiReaction';
// @ts-ignore: No implicit any
import { StopRecordingInSheet } from '../../Header/StreamActions';
// @ts-ignore: No implicit any
import SettingsModal from '../../Settings/SettingsModal';
// @ts-ignore: No implicit any
import { ToastManager } from '../../Toast/ToastManager';
// @ts-ignore: No implicit any
import { ActionTile } from '../ActionTile';
// @ts-ignore: No implicit any
import { ChangeNameModal } from '../ChangeNameModal';
// @ts-ignore: No implicit any
import { MuteAllModal } from '../MuteAllModal';
// @ts-ignore: No implicit any
import { useSidepaneToggle } from '../../AppData/useSidepane';
// @ts-ignore: No implicit any
import { useDropdownList } from '../../hooks/useDropdownList';
// @ts-ignore: No implicit any
import { useMyMetadata } from '../../hooks/useMetadata';
// @ts-ignore: No implicit any
import { getFormattedCount } from '../../../common/utils';
// @ts-ignore: No implicit any
import { SIDE_PANE_OPTIONS } from '../../../common/constants';

// const VirtualBackground = React.lazy(() => import('../../../plugins/VirtualBackground/VirtualBackground'));

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

export const MwebOptions = ({
  elements,
  screenType,
}: {
  elements: DefaultConferencingScreen_Elements;
  screenType: keyof ConferencingScreen;
}) => {
  const hmsActions = useHMSActions();
  const permissions = useHMSStore(selectPermissions);
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const { isBrowserRecordingOn, isStreamingOn, isHLSRunning } = useRecordingStreaming();
  const [openModals, setOpenModals] = useState(new Set());
  const [openOptionsSheet, setOpenOptionsSheet] = useState(false);
  const [openSettingsSheet, setOpenSettingsSheet] = useState(false);
  const [showEmojiCard, setShowEmojiCard] = useState(false);
  const [showRecordingOn, setShowRecordingOn] = useState(false);
  const [isRecordingLoading, setIsRecordingLoading] = useState(false);
  const toggleParticipants = useSidepaneToggle(SIDE_PANE_OPTIONS.PARTICIPANTS);
  const peerCount = useHMSStore(selectPeerCount);
  const emojiCardRef = useRef(null);
  const { isBRBOn, toggleBRB, isHandRaised, toggleHandRaise } = useMyMetadata();
  const { toggleAudio, toggleVideo } = useAVToggle();
  const noAVPermissions = !(toggleAudio || toggleVideo);
  // const isVideoOn = useHMSStore(selectIsLocalVideoEnabled);

  useDropdownList({ open: openModals.size > 0 || openOptionsSheet || openSettingsSheet, name: 'MoreSettings' });

  const updateState = (modalName: string, value: boolean) => {
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

  useClickAway(emojiCardRef, () => setShowEmojiCard(false));

  return (
    <>
      <Sheet.Root open={openOptionsSheet} onOpenChange={setOpenOptionsSheet}>
        <Tooltip title="More options">
          <Sheet.Trigger asChild data-testid="more_settings_btn">
            <IconButton>
              <DragHandleIcon />
            </IconButton>
          </Sheet.Trigger>
        </Tooltip>
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
              alignItems: 'center',
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
            {elements?.participant_list && (
              <ActionTile.Root
                onClick={() => {
                  toggleParticipants();
                  setOpenOptionsSheet(false);
                }}
              >
                <ActionTile.Count>{getFormattedCount(peerCount)}</ActionTile.Count>
                <PeopleIcon />
                <ActionTile.Title>Participants</ActionTile.Title>
              </ActionTile.Root>
            )}

            {!noAVPermissions ? (
              <ActionTile.Root
                active={isHandRaised}
                onClick={() => {
                  toggleHandRaise();
                  setOpenOptionsSheet(false);
                }}
              >
                {isHandRaised ? <HandRaiseSlashedIcon /> : <HandIcon />}
                <ActionTile.Title>{isHandRaised ? 'Lower' : 'Raise'} Hand</ActionTile.Title>
              </ActionTile.Root>
            ) : null}

            {/* {isVideoOn ? (
              <Suspense fallback="">
                <VirtualBackground asActionTile onVBClick={() => setOpenOptionsSheet(false)} />
              </Suspense>
            ) : null} */}

            {elements?.emoji_reactions && (
              <ActionTile.Root
                onClick={() => {
                  setShowEmojiCard(true);
                  setOpenOptionsSheet(false);
                }}
              >
                <EmojiIcon />
                <ActionTile.Title>Emoji Reactions</ActionTile.Title>
              </ActionTile.Root>
            )}

            {elements?.brb && (
              <ActionTile.Root
                active={isBRBOn}
                onClick={() => {
                  toggleBRB();
                  setOpenOptionsSheet(false);
                }}
              >
                <BrbIcon />
                <ActionTile.Title>Be Right Back</ActionTile.Title>
              </ActionTile.Root>
            )}

            <ActionTile.Root
              onClick={() => {
                setOpenSettingsSheet(true);
                setOpenOptionsSheet(false);
              }}
            >
              <SettingsIcon />
              <ActionTile.Title>Settings</ActionTile.Title>
            </ActionTile.Root>

            {isConnected && permissions?.browserRecording ? (
              <ActionTile.Root
                disabled={isHLSRunning}
                onClick={async () => {
                  if (isRecordingLoading) {
                    return;
                  }
                  if (isBrowserRecordingOn || isStreamingOn) {
                    setOpenOptionsSheet(false);
                    setShowRecordingOn(true);
                  } else {
                    // start recording
                    setIsRecordingLoading(true);
                    try {
                      await hmsActions.startRTMPOrRecording({
                        record: true,
                      });
                      setOpenOptionsSheet(false);
                      setIsRecordingLoading(false);
                    } catch (error) {
                      // @ts-ignore
                      if (error.message.includes('stream already running')) {
                        ToastManager.addToast({
                          title: 'Recording already running',
                          variant: 'error',
                        });
                      } else {
                        ToastManager.addToast({
                          // @ts-ignore
                          title: error.message,
                          variant: 'error',
                        });
                      }
                      setIsRecordingLoading(false);
                    }
                  }
                  if (isHLSRunning) {
                    setOpenOptionsSheet(false);
                  }
                }}
              >
                {isRecordingLoading ? <Loading /> : <RecordIcon />}
                <ActionTile.Title>
                  {isBrowserRecordingOn
                    ? 'Recording On'
                    : isRecordingLoading
                    ? 'Starting Recording'
                    : 'Start Recording'}
                </ActionTile.Title>
              </ActionTile.Root>
            ) : null}
          </Box>
        </Sheet.Content>
      </Sheet.Root>
      <SettingsModal open={openSettingsSheet} onOpenChange={setOpenSettingsSheet} screenType={screenType} />
      {openModals.has(MODALS.MUTE_ALL) && (
        <MuteAllModal onOpenChange={(value: boolean) => updateState(MODALS.MUTE_ALL, value)} isMobile />
      )}
      {openModals.has(MODALS.CHANGE_NAME) && (
        <ChangeNameModal
          onOpenChange={(value: boolean) => updateState(MODALS.CHANGE_NAME, value)}
          openParentSheet={() => setOpenOptionsSheet(true)}
        />
      )}

      {showEmojiCard && (
        <Box
          onClick={() => setShowEmojiCard(false)}
          ref={emojiCardRef}
          css={{
            maxWidth: '100%',
            w: '100%',
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: '$18',
            bg: '$surface_default',
            zIndex: '10',
            p: '$8',
            pb: 0,
            r: '$1',
            mx: '$4',
          }}
        >
          <EmojiReaction />
        </Box>
      )}
      {showRecordingOn && (
        <StopRecordingInSheet
          onClose={() => setShowRecordingOn(false)}
          onStopRecording={async () => {
            try {
              await hmsActions.stopRTMPAndRecording();
              setShowRecordingOn(false);
            } catch (error) {
              ToastManager.addToast({
                // @ts-ignore
                title: error.message,
                variant: 'error',
              });
            }
          }}
        />
      )}
    </>
  );
};

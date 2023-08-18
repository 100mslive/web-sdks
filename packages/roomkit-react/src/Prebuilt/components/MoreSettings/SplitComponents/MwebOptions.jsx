import React, { Suspense, useRef, useState } from 'react';
import { useClickAway } from 'react-use';
import {
  selectIsConnectedToRoom,
  selectIsLocalVideoEnabled,
  selectLocalPeerRoleName,
  selectPeerCount,
  selectPermissions,
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
  PencilIcon,
  PeopleIcon,
  RecordIcon,
  SettingsIcon,
} from '@100mslive/react-icons';
import { Box, Tooltip } from '../../../../';
import { Sheet } from '../../../../Sheet';
import IconButton from '../../../IconButton';
import { EmojiCard } from '../../Footer/EmojiCard';
import { StopRecordingInSheet } from '../../Header/StreamActions';
import SettingsModal from '../../Settings/SettingsModal';
import { ToastManager } from '../../Toast/ToastManager';
import { ActionTile } from '.././ActionTile';
import { ChangeNameModal } from '.././ChangeNameModal';
import { MuteAllModal } from '.././MuteAllModal';
import { useSidepaneToggle } from '../../AppData/useSidepane';
import { useHLSViewerRole } from '../../AppData/useUISettings';
import { useDropdownList } from '../../hooks/useDropdownList';
import { useIsFeatureEnabled } from '../../hooks/useFeatures';
import { useMyMetadata } from '../../hooks/useMetadata';
import { FEATURE_LIST, SIDE_PANE_OPTIONS } from '../../../common/constants';

const VirtualBackground = React.lazy(() => import('../../../plugins/VirtualBackground/VirtualBackground'));

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

export const MwebOptions = () => {
  const hmsActions = useHMSActions();
  const permissions = useHMSStore(selectPermissions);
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const { isBrowserRecordingOn, isStreamingOn, isHLSRunning } = useRecordingStreaming();

  const [openModals, setOpenModals] = useState(new Set());
  const { isHandRaised, isBRBOn, toggleHandRaise, toggleBRB } = useMyMetadata();
  const isHandRaiseEnabled = useIsFeatureEnabled(FEATURE_LIST.HAND_RAISE);
  const isBRBEnabled = useIsFeatureEnabled(FEATURE_LIST.BRB);

  const [openOptionsSheet, setOpenOptionsSheet] = useState(false);
  const [openSettingsSheet, setOpenSettingsSheet] = useState(false);
  const [showEmojiCard, setShowEmojiCard] = useState(false);
  const [showRecordingOn, setShowRecordingOn] = useState(false);
  const toggleParticipants = useSidepaneToggle(SIDE_PANE_OPTIONS.PARTICIPANTS);
  const peerCount = useHMSStore(selectPeerCount);

  const emojiCardRef = useRef(null);
  const isVideoOn = useHMSStore(selectIsLocalVideoEnabled);

  const hlsViewer = useHLSViewerRole();
  const localPeerRole = useHMSStore(selectLocalPeerRoleName);
  const isHLSViewer = hlsViewer === localPeerRole;

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

  useClickAway(emojiCardRef, () => setShowEmojiCard(false));

  return (
    <>
      <Sheet.Root open={openOptionsSheet} onOpenChange={setOpenOptionsSheet}>
        <Sheet.Trigger asChild data-testid="more_settings_btn">
          <IconButton>
            <Tooltip title="More options">
              <DragHandleIcon />
            </Tooltip>
          </IconButton>
        </Sheet.Trigger>
        <Sheet.Content css={{ bg: isHLSViewer ? '$surface_default' : '$surface_dim', pb: '$14' }}>
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
            <ActionTile
              title="Participants"
              icon={<PeopleIcon />}
              onClick={toggleParticipants}
              setOpenOptionsSheet={setOpenOptionsSheet}
              number={peerCount}
            />
            {isHandRaiseEnabled && !isHLSViewer ? (
              <ActionTile
                title="Raise Hand"
                icon={<HandIcon />}
                onClick={toggleHandRaise}
                active={isHandRaised}
                setOpenOptionsSheet={setOpenOptionsSheet}
              />
            ) : null}
            {isBRBEnabled && !isHLSViewer ? (
              <ActionTile
                title="Be Right Back"
                icon={<BrbIcon />}
                onClick={toggleBRB}
                active={isBRBOn}
                setOpenOptionsSheet={setOpenOptionsSheet}
              />
            ) : null}
            <ActionTile
              title="Change Name"
              icon={<PencilIcon />}
              onClick={() => updateState(MODALS.CHANGE_NAME, true)}
              setOpenOptionsSheet={setOpenOptionsSheet}
            />
            {isVideoOn && !isHLSViewer ? (
              <Suspense fallback="">
                <VirtualBackground asActionTile onVBClick={() => setOpenOptionsSheet(false)} />
              </Suspense>
            ) : null}

            <ActionTile
              title="Emoji Reactions"
              icon={<EmojiIcon />}
              onClick={() => setShowEmojiCard(true)}
              setOpenOptionsSheet={setOpenOptionsSheet}
            />

            <ActionTile
              title="Settings"
              icon={<SettingsIcon />}
              onClick={() => setOpenSettingsSheet(true)}
              setOpenOptionsSheet={setOpenOptionsSheet}
            />

            {isConnected && permissions?.browserRecording && (
              <ActionTile
                title={isBrowserRecordingOn ? 'Recording On' : 'Start Recording'}
                disabled={isHLSRunning}
                icon={<RecordIcon />}
                onClick={async () => {
                  if (isBrowserRecordingOn || isStreamingOn) {
                    setShowRecordingOn(true);
                  } else {
                    // start recording
                    setOpenOptionsSheet(false);
                    try {
                      await hmsActions.startRTMPOrRecording({
                        record: true,
                      });
                    } catch (error) {
                      if (error.message.includes('stream already running')) {
                        ToastManager.addToast({
                          title: 'Recording already running',
                          variant: 'error',
                        });
                      } else {
                        ToastManager.addToast({
                          title: error.message,
                          variant: 'error',
                        });
                      }
                    }
                  }
                }}
                setOpenOptionsSheet={setOpenOptionsSheet}
              />
            )}
          </Box>
        </Sheet.Content>
      </Sheet.Root>
      <SettingsModal open={openSettingsSheet} onOpenChange={setOpenSettingsSheet} />
      {openModals.has(MODALS.MUTE_ALL) && (
        <MuteAllModal onOpenChange={value => updateState(MODALS.MUTE_ALL, value)} isMobile />
      )}
      {openModals.has(MODALS.CHANGE_NAME) && (
        <ChangeNameModal
          onOpenChange={value => updateState(MODALS.CHANGE_NAME, value)}
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
          <EmojiCard />
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

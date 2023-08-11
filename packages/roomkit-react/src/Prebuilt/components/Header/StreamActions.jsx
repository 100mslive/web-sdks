import React, { Fragment, useState } from 'react';
import { useMedia } from 'react-use';
import {
  HMSRoomState,
  selectIsConnectedToRoom,
  selectPermissions,
  selectRoomState,
  useHMSActions,
  useHMSStore,
  useRecordingStreaming,
} from '@100mslive/react-sdk';
import { AlertTriangleIcon, CrossIcon, RecordIcon, WrenchIcon } from '@100mslive/react-icons';
import { Box, Button, config as cssConfig, Flex, HorizontalDivider, Loading, Popover, Text, Tooltip } from '../../../';
import { Sheet } from '../../../Sheet';
import GoLiveButton from '../GoLiveButton';
import { ResolutionInput } from '../Streaming/ResolutionInput';
import { getResolution } from '../Streaming/RTMPStreaming';
import { ToastManager } from '../Toast/ToastManager';
import { AdditionalRoomState, getRecordingText } from './AdditionalRoomState';
import { useSidepaneToggle } from '../AppData/useSidepane';
import { useSetAppDataByKey } from '../AppData/useUISettings';
import { APP_DATA, RTMP_RECORD_DEFAULT_RESOLUTION, SIDE_PANE_OPTIONS } from '../../common/constants';

export const LiveStatus = () => {
  const { isHLSRunning, isRTMPRunning } = useRecordingStreaming();
  if (!isHLSRunning && !isRTMPRunning) {
    return null;
  }
  return (
    <Flex align="center">
      <Box css={{ w: '$4', h: '$4', r: '$round', bg: '$alert_error_default', mr: '$2' }} />
      <Text>
        Live
        <Text as="span" css={{ '@md': { display: 'none' } }}>
          &nbsp;with {isHLSRunning ? 'HLS' : 'RTMP'}
        </Text>
      </Text>
    </Flex>
  );
};

export const RecordingStatus = () => {
  const { isBrowserRecordingOn, isServerRecordingOn, isHLSRecordingOn, isRecordingOn } = useRecordingStreaming();
  const permissions = useHMSStore(selectPermissions);

  if (
    !isRecordingOn ||
    // if only browser recording is enabled, stop recording is shown
    // so no need to show this as it duplicates
    [permissions?.browserRecording, !isServerRecordingOn, !isHLSRecordingOn, isBrowserRecordingOn].every(
      value => !!value,
    )
  ) {
    return null;
  }
  return (
    <Tooltip
      title={getRecordingText({
        isBrowserRecordingOn,
        isServerRecordingOn,
        isHLSRecordingOn,
      })}
    >
      <Box
        css={{
          color: '$alert_error_default',
        }}
      >
        <RecordIcon width={24} height={24} />
      </Box>
    </Tooltip>
  );
};

const EndStream = () => {
  const toggleStreaming = useSidepaneToggle(SIDE_PANE_OPTIONS.STREAMING);

  return (
    <Button data-testid="end_stream" variant="danger" icon onClick={toggleStreaming}>
      <WrenchIcon />
      Manage Stream
    </Button>
  );
};

const StartRecording = () => {
  const permissions = useHMSStore(selectPermissions);
  const [resolution, setResolution] = useState(RTMP_RECORD_DEFAULT_RESOLUTION);
  const [open, setOpen] = useState(false);
  const [recordingStarted, setRecordingState] = useSetAppDataByKey(APP_DATA.recordingStarted);
  const { isBrowserRecordingOn, isStreamingOn, isHLSRunning } = useRecordingStreaming();
  const hmsActions = useHMSActions();
  if (!permissions?.browserRecording || isHLSRunning) {
    return null;
  }
  if (isBrowserRecordingOn) {
    return (
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <Button variant="danger" data-testid="stop_recording" icon outlined onClick={() => setOpen(true)}>
            <RecordIcon />
            <Text as="span" css={{ '@md': { display: 'none' }, color: 'currentColor' }}>
              Stop Recording
            </Text>
          </Button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content align="end" sideOffset={8} css={{ w: '$64' }}>
            <Text variant="body" css={{ color: '$on_surface_medium' }}>
              Are you sure you want to end the recording?
            </Text>
            <Button
              data-testid="stop_recording_confirm"
              variant="danger"
              icon
              css={{ ml: 'auto' }}
              onClick={async () => {
                try {
                  await hmsActions.stopRTMPAndRecording();
                } catch (error) {
                  ToastManager.addToast({
                    title: error.message,
                    variant: 'error',
                  });
                }
                setOpen(false);
              }}
            >
              Stop
            </Button>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    );
  }
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button
          data-testid="start_recording"
          variant="standard"
          icon
          disabled={recordingStarted || isStreamingOn}
          onClick={() => setOpen(true)}
        >
          {recordingStarted ? <Loading size={24} color="currentColor" /> : <RecordIcon />}
          <Text as="span" css={{ '@md': { display: 'none' }, color: 'currentColor' }}>
            {recordingStarted ? 'Starting' : 'Start'} Recording
          </Text>
        </Button>
      </Popover.Trigger>
      <Popover.Content align="end" sideOffset={8} css={{ w: '$64' }}>
        <ResolutionInput
          testId="recording_resolution"
          css={{ flexDirection: 'column', alignItems: 'start' }}
          onResolutionChange={setResolution}
        />
        <Button
          data-testid="start_recording_confirm"
          variant="primary"
          icon
          css={{ ml: 'auto' }}
          type="submit"
          disabled={recordingStarted || isStreamingOn}
          onClick={async () => {
            try {
              setRecordingState(true);
              await hmsActions.startRTMPOrRecording({
                resolution: getResolution(resolution),
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
              setRecordingState(false);
            }
            setOpen(false);
          }}
        >
          Start
        </Button>
      </Popover.Content>
    </Popover.Root>
  );
};

export const StreamActions = () => {
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const permissions = useHMSStore(selectPermissions);
  const isMobile = useMedia(cssConfig.media.md);
  const { isStreamingOn } = useRecordingStreaming();
  const roomState = useHMSStore(selectRoomState);

  return (
    <Flex align="center" css={{ gap: '$4' }}>
      <AdditionalRoomState />
      <Flex align="center" css={{ gap: '$4', '@md': { display: 'none' } }}>
        {roomState !== HMSRoomState.Preview ? <LiveStatus /> : null}
        <RecordingStatus />
      </Flex>
      {isConnected && !isMobile ? <StartRecording /> : null}
      {isConnected && (permissions.hlsStreaming || permissions.rtmpStreaming) && (
        <Fragment>{isStreamingOn ? <EndStream /> : <GoLiveButton />}</Fragment>
      )}
    </Flex>
  );
};

export const StopRecordingInSheet = ({ onStopRecording, onClose }) => {
  return (
    <Sheet.Root>
      <Sheet.Content>
        <Sheet.Title css={{ p: '$10' }}>
          <Flex direction="row" justify="between" css={{ w: '100%', c: '$alert_error_default' }}>
            <Flex justify="start" align="center" gap="3">
              <AlertTriangleIcon />
              <Text variant="h5">Stop Recording</Text>
            </Flex>
            <Sheet.Close css={{ color: 'white' }} onClick={onClose}>
              <CrossIcon />
            </Sheet.Close>
          </Flex>
        </Sheet.Title>
        <HorizontalDivider />
        <Box as="div" css={{ p: '$10', overflowY: 'scroll', maxHeight: '70vh' }}>
          <Text variant="caption" css={{ c: '$on_surface_medium' }}>
            Are you sure you want to stop recording? You can’t undo this action.
          </Text>
          <Button
            variant="danger"
            css={{ width: '100%' }}
            type="submit"
            data-testid="popup_change_btn"
            onClick={onStopRecording}
          >
            Stop
          </Button>
        </Box>
      </Sheet.Content>
    </Sheet.Root>
  );
};

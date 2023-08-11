import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useMedia } from 'react-use';
import {
  HMSRoomState,
  selectHLSState,
  selectIsConnectedToRoom,
  selectPermissions,
  selectRoomState,
  useHMSActions,
  useHMSStore,
  useRecordingStreaming,
} from '@100mslive/react-sdk';
import { RecordIcon } from '@100mslive/react-icons';
import { Box, Button, config as cssConfig, Flex, Loading, Popover, Text, Tooltip } from '../../../';
import { ResolutionInput } from '../Streaming/ResolutionInput';
import { getResolution } from '../Streaming/RTMPStreaming';
import { ToastManager } from '../Toast/ToastManager';
import { AdditionalRoomState, getRecordingText } from './AdditionalRoomState';
import { useSetAppDataByKey } from '../AppData/useUISettings';
import { APP_DATA, RTMP_RECORD_DEFAULT_RESOLUTION } from '../../common/constants';

export const LiveStatus = () => {
  const { isHLSRunning, isRTMPRunning } = useRecordingStreaming();
  const hlsState = useHMSStore(selectHLSState);
  const isMobile = useMedia(cssConfig.media.md);
  const intervalRef = useRef(null);

  const [liveTime, setLiveTime] = useState(0);

  const startTimer = useCallback(() => {
    intervalRef.current = setInterval(() => {
      if (hlsState?.running) {
        setLiveTime(Date.now() - hlsState?.variants[0]?.startedAt.getTime());
      }
    }, 1000);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (hlsState?.running && !isMobile) {
      startTimer();
    }
    if (!hlsState?.running && intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [hlsState.running, isMobile, startTimer]);

  const formatTime = timeInSeconds => {
    timeInSeconds = Math.floor(timeInSeconds / 1000);
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;
    const hour = hours !== 0 ? `${hours < 10 ? '0' : ''}${hours}:` : '';
    return `${hour}${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  if (!isHLSRunning && !isRTMPRunning) {
    return null;
  }
  return (
    <Flex align="center" gap="2">
      <Box css={{ w: '$4', h: '$4', r: '$round', bg: '$alert_error_default', mr: '$2', '@md': { display: 'none' } }} />
      {isMobile ? (
        <Text
          css={{
            bg: '$alert_error_default',
            c: 'on_surface_high',
            borderRadius: '$0',
            padding: '$2 $4 $2 $4',
          }}
        >
          Live
        </Text>
      ) : (
        <Text>LIVE</Text>
      )}
      <Text variant="caption" css={{ '@md': { display: 'none' } }}>
        {hlsState?.variants?.length > 0 ? formatTime(liveTime) : ''}
      </Text>
    </Flex>
  );
};

export const RecordingStatus = () => {
  const { isBrowserRecordingOn, isServerRecordingOn, isHLSRecordingOn, isRecordingOn } = useRecordingStreaming();
  const permissions = useHMSStore(selectPermissions);
  const isMobile = useMedia(cssConfig.media.md);

  if (
    !isRecordingOn ||
    // if only browser recording is enabled, stop recording is shown
    // so no need to show this as it duplicates
    [permissions?.browserRecording, !isServerRecordingOn, !isHLSRecordingOn, isBrowserRecordingOn].every(
      value => !!value,
    )
  ) {
    // show recording icon in mobile without popover
    if (!(isMobile && isRecordingOn)) return null;
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
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <RecordIcon width={24} height={24} />
      </Box>
    </Tooltip>
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

/**
 * @description only start recording button will be shown.
 */
export const StreamActions = () => {
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const isMobile = useMedia(cssConfig.media.md);
  const roomState = useHMSStore(selectRoomState);

  return (
    <Flex align="center" css={{ gap: '$4' }}>
      <AdditionalRoomState />
      <Flex align="center" css={{ gap: '$4' }}>
        <RecordingStatus />
        {roomState !== HMSRoomState.Preview ? <LiveStatus /> : null}
      </Flex>
      {isConnected && !isMobile ? <StartRecording /> : null}
    </Flex>
  );
};

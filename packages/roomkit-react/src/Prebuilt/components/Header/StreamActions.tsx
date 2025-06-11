import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useMedia } from 'react-use';
import { HMSRecordingState } from '@100mslive/hms-video-store';
import {
  HMSRoomState,
  selectHLSState,
  selectIsConnectedToRoom,
  selectPermissions,
  selectRecordingState,
  selectRoomState,
  useHMSActions,
  useHMSStore,
  useRecordingStreaming,
} from '@100mslive/react-sdk';
import { AlertTriangleIcon, CrossIcon, PauseCircleIcon, RecordIcon } from '@100mslive/react-icons';
import { Box, Button, config as cssConfig, Flex, HorizontalDivider, Loading, Popover, Text, Tooltip } from '../../..';
import { Sheet } from '../../../Sheet';
// @ts-ignore
import { ToastManager } from '../Toast/ToastManager';
import { useRoomLayoutConferencingScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
import { useRecordingHandler } from '../../common/hooks';
// @ts-ignore
import { formatTime } from '../../common/utils';

export const getRecordingText = (
  {
    isBrowserRecordingOn,
    isServerRecordingOn,
    isHLSRecordingOn,
  }: { isBrowserRecordingOn: boolean; isServerRecordingOn: boolean; isHLSRecordingOn: boolean },
  delimiter = ', ',
) => {
  if (!isBrowserRecordingOn && !isServerRecordingOn && !isHLSRecordingOn) {
    return '';
  }
  const title: string[] = [];
  if (isBrowserRecordingOn) {
    title.push('Recording');
  }
  if (isServerRecordingOn) {
    title.push('Server');
  }
  if (isHLSRecordingOn) {
    title.push('HLS');
  }
  return title.join(delimiter);
};

export const LiveStatus = () => {
  const { isHLSRunning, isRTMPRunning } = useRecordingStreaming();
  const hlsState = useHMSStore(selectHLSState);
  const isMobile = useMedia(cssConfig.media.md);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { screenType } = useRoomLayoutConferencingScreen();
  const [liveTime, setLiveTime] = useState(0);

  const startTimer = useCallback(() => {
    intervalRef.current = setInterval(() => {
      const timeStamp = hlsState?.variants[0]?.[screenType === 'hls_live_streaming' ? 'startedAt' : 'initialisedAt'];
      if (hlsState?.running && timeStamp) {
        setLiveTime(Date.now() - timeStamp.getTime());
      }
    }, 1000);
  }, [hlsState?.running, hlsState?.variants, screenType]);

  useEffect(() => {
    if (hlsState?.running) {
      startTimer();
    }
    if (!hlsState?.running && intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [hlsState.running, isMobile, startTimer]);

  if (!isHLSRunning && !isRTMPRunning) {
    return null;
  }
  return (
    <Flex
      align="center"
      gap="1"
      css={{
        border: '1px solid $border_default',
        padding: '$4 $6 $4 $6',
        borderRadius: '$1',
      }}
    >
      <Box css={{ w: '$4', h: '$4', r: '$round', bg: '$alert_error_default', mr: '$2' }} />
      <Flex align="center" gap="2">
        <Text variant={!isMobile ? 'button' : 'body2'}>LIVE</Text>
        <Text variant="caption">{hlsState?.variants?.length > 0 && isHLSRunning ? formatTime(liveTime) : ''}</Text>
      </Flex>
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
      boxCss={{ zIndex: 1 }}
      title={getRecordingText({
        isBrowserRecordingOn,
        isServerRecordingOn,
        isHLSRecordingOn,
      })}
    >
      <Flex
        css={{
          color: '$alert_error_default',
          alignItems: 'center',
        }}
      >
        <RecordIcon width={24} height={24} />
      </Flex>
    </Tooltip>
  );
};

export const RecordingPauseStatus = () => {
  const recording = useHMSStore(selectRecordingState);
  if (recording.hls && recording.hls.state === HMSRecordingState.PAUSED) {
    return (
      <Tooltip
        boxCss={{ zIndex: 1 }}
        title={getRecordingText({
          isBrowserRecordingOn: false,
          isServerRecordingOn: false,
          isHLSRecordingOn: true,
        })}
      >
        <Flex
          css={{
            color: '$on_surface_high',
            alignItems: 'center',
          }}
        >
          <PauseCircleIcon width={24} height={24} />
        </Flex>
      </Tooltip>
    );
  }
  return null;
};

const StartRecording = () => {
  const permissions = useHMSStore(selectPermissions);
  const [open, setOpen] = useState(false);
  const { startRecording, recordingStarted } = useRecordingHandler();
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
            <Text variant="body1" css={{ color: '$on_surface_medium' }}>
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
                  const err = error as Error;
                  ToastManager.addToast({
                    title: err.message,
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
    <Button
      data-testid="start_recording"
      variant="standard"
      icon
      disabled={recordingStarted || isStreamingOn}
      onClick={async () => {
        await startRecording();
      }}
    >
      {recordingStarted ? <Loading size={24} color="currentColor" /> : <RecordIcon />}
      <Text as="span" css={{ '@md': { display: 'none' }, color: 'currentColor' }}>
        {recordingStarted ? 'Starting' : 'Start'} Recording
      </Text>
    </Button>
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
      {!isMobile && (
        <Flex align="center" css={{ gap: '$4' }}>
          <RecordingPauseStatus />
          <RecordingStatus />
          {roomState !== HMSRoomState.Preview ? <LiveStatus /> : null}
        </Flex>
      )}
      {isConnected && !isMobile ? <StartRecording /> : null}
    </Flex>
  );
};

export const StopRecordingInSheet = ({
  onStopRecording,
  onClose,
}: {
  onStopRecording: () => void;
  onClose: () => void;
}) => {
  return (
    <Sheet.Root open={true}>
      <Sheet.Content>
        <Sheet.Title css={{ p: '$10' }}>
          <Flex direction="row" justify="between" css={{ w: '100%', c: '$alert_error_default' }}>
            <Flex justify="start" align="center" gap="3">
              <AlertTriangleIcon />
              <Text variant="h5" css={{ c: '$alert_error_default' }}>
                Stop Recording
              </Text>
            </Flex>
            <Sheet.Close css={{ color: 'white' }} onClick={onClose}>
              <CrossIcon />
            </Sheet.Close>
          </Flex>
        </Sheet.Title>
        <HorizontalDivider />
        <Box as="div" css={{ p: '$10', overflowY: 'scroll', maxHeight: '70vh' }}>
          <Text variant="caption" css={{ c: '$on_surface_medium', pb: '$8' }}>
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

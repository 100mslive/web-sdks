import React, { useState } from 'react';
import { selectPermissions, useHMSActions, useHMSStore, useRecordingStreaming } from '@100mslive/react-sdk';
import { AlertTriangleIcon } from '@100mslive/react-icons';
import { Button, Dialog, Flex, Text } from '../../../';
import { ResolutionInput } from '../Streaming/ResolutionInput';
import { ToastManager } from '../Toast/ToastManager';
import { useRecordingHandler } from '../../common/hooks';
import { RTMP_RECORD_DEFAULT_RESOLUTION } from '../../common/constants';

const StartRecording = ({ open, onOpenChange }) => {
  const permissions = useHMSStore(selectPermissions);
  const [resolution, setResolution] = useState(RTMP_RECORD_DEFAULT_RESOLUTION);
  const { startRecording, recordingStarted } = useRecordingHandler();
  const { isBrowserRecordingOn, isStreamingOn, isHLSRunning } = useRecordingStreaming();
  const hmsActions = useHMSActions();
  if (!permissions?.browserRecording || isHLSRunning) {
    return null;
  }
  if (isBrowserRecordingOn) {
    return (
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Content
            css={{
              width: 'min(400px,80%)',
              p: '10',
              bg: '#201617',
            }}
          >
            <Dialog.Title>
              <Flex gap={2} css={{ c: 'alert.error.default' }}>
                <AlertTriangleIcon />
                <Text css={{ c: 'inherit' }} variant="h6">
                  End Recording
                </Text>
              </Flex>
            </Dialog.Title>
            <Text variant="sm" css={{ c: 'onSurface.medium', my: '8' }}>
              Are you sure you want to end recording? You can’t undo this action.
            </Text>
            <Flex justify="end" css={{ mt: '12' }}>
              <Dialog.Close asChild>
                <Button outlined css={{ borderColor: 'secondary.bright', mr: '4' }}>
                  Don't end
                </Button>
              </Dialog.Close>
              <Button
                data-testid="stop_recording_confirm_mobile"
                variant="danger"
                icon
                onClick={async () => {
                  try {
                    await hmsActions.stopRTMPAndRecording();
                  } catch (error) {
                    ToastManager.addToast({
                      title: error.message,
                      variant: 'error',
                    });
                  }
                  onOpenChange(false);
                }}
              >
                End recording
              </Button>
            </Flex>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content css={{ width: 'min(400px,80%)', p: '10' }}>
        <Dialog.Title>
          <Text variant="h6">Start Recording</Text>
        </Dialog.Title>
        <ResolutionInput
          testId="recording_resolution_mobile"
          css={{ flexDirection: 'column', alignItems: 'start' }}
          onResolutionChange={setResolution}
        />
        <Button
          data-testid="start_recording_confirm_mobile"
          variant="primary"
          icon
          css={{ ml: 'auto' }}
          type="submit"
          disabled={recordingStarted || isStreamingOn}
          onClick={async () => {
            await startRecording(resolution);
            onOpenChange(false);
          }}
        >
          Start
        </Button>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default StartRecording;

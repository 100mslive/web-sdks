/* eslint-disable react/prop-types */
import React, { useCallback, useEffect, useState } from 'react';
import {
  HMSException,
  selectDevices,
  selectLocalAudioTrackID,
  selectLocalMediaSettings,
  selectTrackAudioByID,
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';
import { MicOnIcon, SpeakerIcon, StopIcon } from '@100mslive/react-icons';
import { PermissionErrorModal } from '../Prebuilt/components/Notifications/PermissionErrorModal';
import { TestContainer, TestFooter } from './components';
import { Button } from '../Button';
import { Box, Flex } from '../Layout';
import { Progress } from '../Progress';
import { Text } from '../Text';
// @ts-ignore: No implicit any
import { DeviceSelector } from './DeviceSelector';
import { DiagnosticsStep, useDiagnostics } from './DiagnosticsContext';
import { useAudioOutputTest } from '../Prebuilt/components/hooks/useAudioOutputTest';
import { TEST_AUDIO_URL } from '../Prebuilt/common/constants';

const SelectContainer = ({ children }: { children: React.ReactNode }) => (
  <Box css={{ w: 'calc(50% - 0.75rem)', '@lg': { w: '100%' } }}>{children}</Box>
);

const MicTest = ({ setError }: { setError: (err?: Error) => void }) => {
  const { hmsDiagnostics } = useDiagnostics();
  const devices = useHMSStore(selectDevices);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedMic, setSelectedMic] = useState(devices.audioInput[0]?.deviceId || 'default');
  const trackID = useHMSStore(selectLocalAudioTrackID);
  const audioLevel = useHMSStore(selectTrackAudioByID(trackID));
  const { audioOutputDeviceId } = useHMSStore(selectLocalMediaSettings);
  const { playing, setPlaying, audioRef } = useAudioOutputTest({
    deviceId: audioOutputDeviceId || devices.audioOutput[0]?.deviceId,
  });

  return (
    <SelectContainer>
      <DeviceSelector
        title="Microphone (Input)"
        devices={devices.audioInput}
        selection={selectedMic}
        icon={<MicOnIcon />}
        onChange={(deviceId: string) => {
          setError(undefined);
          setSelectedMic(deviceId);
          hmsDiagnostics?.stopMicCheck();
        }}
      />
      <Flex css={{ gap: '6', alignItems: 'center' }}>
        <Button
          variant="standard"
          icon
          onClick={() => {
            isRecording
              ? hmsDiagnostics?.stopMicCheck()
              : hmsDiagnostics
                  ?.startMicCheck({
                    inputDevice: selectedMic,
                    onError: (err: Error) => {
                      setError(err);
                    },
                    onStop: () => {
                      setIsRecording(false);
                    },
                  })
                  .then(() => {
                    setIsRecording(true);
                  });
          }}
          disabled={devices.audioInput.length === 0 || playing}
        >
          {isRecording ? <StopIcon /> : <MicOnIcon />}
          {isRecording ? 'Stop Recording' : 'Record'}
        </Button>

        <Button
          icon
          variant="standard"
          outlined={hmsDiagnostics?.getRecordedAudio() === TEST_AUDIO_URL}
          onClick={() => {
            if (audioRef.current) {
              audioRef.current.src = hmsDiagnostics?.getRecordedAudio() || '';
              audioRef.current.play();
            }
          }}
          disabled={playing || hmsDiagnostics?.getRecordedAudio() === TEST_AUDIO_URL}
        >
          <SpeakerIcon />
          {playing ? 'Playing...' : 'Playback'}
        </Button>
        <audio
          ref={audioRef}
          onEnded={() => setPlaying(false)}
          onPlay={() => setPlaying(true)}
          style={{ display: 'none' }}
        />
      </Flex>

      <Flex align="center" css={{ mt: '4', maxWidth: '10rem', opacity: isRecording ? '1' : '0', gap: '4' }}>
        <Text>
          <MicOnIcon />
        </Text>
        <Progress.Root value={audioLevel} css={{ h: '2' }}>
          <Progress.Content
            style={{
              transform: `translateX(-${100 - audioLevel}%)`,
              transition: 'transform 0.3s',
            }}
          />
        </Progress.Root>
      </Flex>
    </SelectContainer>
  );
};

const SpeakerTest = () => {
  const actions = useHMSActions();
  const devices = useHMSStore(selectDevices);
  const { audioOutputDeviceId } = useHMSStore(selectLocalMediaSettings);

  if (devices.audioOutput.length === 0) {
    return <></>;
  }

  return (
    <SelectContainer>
      <DeviceSelector
        title="Speaker (Output)"
        devices={devices.audioOutput}
        selection={audioOutputDeviceId || devices.audioOutput[0]?.deviceId}
        icon={<SpeakerIcon />}
        onChange={(deviceId: string) => {
          actions.setAudioOutputDevice(deviceId);
        }}
      />
    </SelectContainer>
  );
};

export const AudioTest = () => {
  const { hmsDiagnostics, updateStep } = useDiagnostics();
  const [error, setErrorAlone] = useState<Error | undefined>();

  const setError = useCallback(
    (err?: Error) => {
      updateStep(DiagnosticsStep.AUDIO, { hasFailed: !!err });
      setErrorAlone(err);
    },
    [updateStep, setErrorAlone],
  );

  useEffect(() => {
    hmsDiagnostics?.requestPermission({ audio: true }).catch(error => setError(error));
  }, [hmsDiagnostics, setError]);

  return (
    <>
      <TestContainer>
        <Text variant="body2" css={{ c: 'onPrimary.medium' }}>
          Record a 10 second audio clip and play it back to check that your microphone and speaker are working. If they
          aren't, make sure your volume is turned up, try a different speaker or microphone, or check your bluetooth
          settings.
        </Text>

        <Flex
          css={{
            mt: '10',
            gap: '10',
            '@lg': {
              flexDirection: 'column',
              gap: '8',
            },
          }}
        >
          <MicTest setError={setError} />
          <SpeakerTest />
        </Flex>
      </TestContainer>
      <TestFooter error={error} ctaText="Does your audio sound good?" />
      <PermissionErrorModal error={error as HMSException} />
    </>
  );
};

/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import {
  selectDevices,
  selectLocalAudioTrackID,
  selectLocalMediaSettings,
  selectTrackAudioByID,
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';
import { MicOnIcon, SpeakerIcon } from '@100mslive/react-icons';
import { TestContainer, TestFooter } from './components';
import { Button } from '../Button';
import { Box, Flex } from '../Layout';
import { Progress } from '../Progress';
import { Text } from '../Text';
// @ts-ignore: No implicit any
import { DeviceSelector } from './DeviceSelector';
import { hmsDiagnostics } from './hms';
import { useAudioOutputTest } from '../Prebuilt/components/hooks/useAudioOutputTest';
import { TEST_AUDIO_URL } from '../Prebuilt/common/constants';

const MicTest = () => {
  const devices = useHMSStore(selectDevices);
  const [isRecording, setIsRecording] = useState(false);
  const { audioInputDeviceId } = useHMSStore(selectLocalMediaSettings);
  const [selectedMic, setSelectedMic] = useState(audioInputDeviceId || 'default');
  const trackID = useHMSStore(selectLocalAudioTrackID);
  const audioLevel = useHMSStore(selectTrackAudioByID(trackID));

  return (
    <Box css={{ w: '50%' }}>
      <DeviceSelector
        title="Microphone(Input)"
        devices={devices.audioInput}
        selection={selectedMic}
        icon={<MicOnIcon />}
        onChange={(deviceId: string) => {
          setSelectedMic(deviceId);
          hmsDiagnostics.stopMicCheck();
          setIsRecording(false);
        }}
      />
      <Flex css={{ gap: '$6', alignItems: 'center' }}>
        <Button
          onClick={() =>
            hmsDiagnostics
              .startMicCheck(selectedMic, () => {
                setIsRecording(false);
              })
              .then(() => {
                setIsRecording(true);
              })
          }
          disabled={isRecording}
        >
          {isRecording ? 'Recording...' : 'Record'}
        </Button>
        {isRecording && (
          <>
            <Text>
              <MicOnIcon />
            </Text>
            <Progress.Root value={audioLevel} css={{ h: '$2' }}>
              <Progress.Content
                style={{
                  transform: `translateX(-${100 - audioLevel}%)`,
                  transition: 'transform 0.3s',
                }}
              />
            </Progress.Root>
          </>
        )}
      </Flex>
    </Box>
  );
};

const SpeakerTest = () => {
  const actions = useHMSActions();
  const devices = useHMSStore(selectDevices);
  const { audioOutputDeviceId } = useHMSStore(selectLocalMediaSettings);
  const { playing, setPlaying, audioRef } = useAudioOutputTest({ deviceId: audioOutputDeviceId || 'default' });

  return (
    <Box css={{ w: '50%' }}>
      <DeviceSelector
        title="Speaker(output)"
        devices={devices.audioOutput}
        selection={audioOutputDeviceId || 'default'}
        icon={<SpeakerIcon />}
        onChange={(deviceId: string) => {
          actions.setAudioOutputDevice(deviceId);
        }}
      />
      <Button
        onClick={() => {
          if (audioRef.current) {
            audioRef.current.src = hmsDiagnostics.getRecordedAudio() || TEST_AUDIO_URL;
            audioRef.current.play();
          }
        }}
        disabled={playing}
      >
        <SpeakerIcon />
        <Text css={{ ml: '$4' }}>{playing ? 'Playing' : 'Playback'}</Text>
      </Button>
      <audio
        ref={audioRef}
        onEnded={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        style={{ display: 'none' }}
      />
    </Box>
  );
};

export const AudioTest = () => {
  const [error, setError] = useState<Error | undefined>();
  useEffect(() => {
    hmsDiagnostics.requestPermission({ audio: true }).catch(error => setError(error));
  }, []);

  return (
    <>
      <TestContainer>
        <Text variant="body2" css={{ c: '$on_primary_medium' }}>
          Record an audio clip and play it back to check that your microphone and speaker are working. If they aren't,
          make sure your volume is turned up, try a different speaker or microphone, or check your bluetooth settings.
        </Text>

        <Flex css={{ mt: '$10', gap: '$10' }}>
          <MicTest />
          <SpeakerTest />
        </Flex>
      </TestContainer>
      <TestFooter error={error} />
    </>
  );
};

/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import { useMedia } from 'react-use';
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
import { config as cssConfig } from '../Theme';
// @ts-ignore: No implicit any
import { DeviceSelector } from './DeviceSelector';
import { hmsDiagnostics } from './hms';
import { useAudioOutputTest } from '../Prebuilt/components/hooks/useAudioOutputTest';
import { isSafari, TEST_AUDIO_URL } from '../Prebuilt/common/constants';

const SelectContainer = ({ children }: { children: React.ReactNode }) => (
  <Box css={{ w: '50%', '@lg': { w: '100%' } }}>{children}</Box>
);

const MicTest = () => {
  const devices = useHMSStore(selectDevices);
  const [isRecording, setIsRecording] = useState(false);
  const { audioInputDeviceId } = useHMSStore(selectLocalMediaSettings);
  const [selectedMic, setSelectedMic] = useState(audioInputDeviceId || 'default');
  const trackID = useHMSStore(selectLocalAudioTrackID);
  const audioLevel = useHMSStore(selectTrackAudioByID(trackID));
  const { audioOutputDeviceId } = useHMSStore(selectLocalMediaSettings);
  const { playing, setPlaying, audioRef } = useAudioOutputTest({ deviceId: audioOutputDeviceId || 'default' });

  return (
    <SelectContainer>
      <DeviceSelector
        title="Microphone (Input)"
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
          variant="standard"
          icon
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
          <MicOnIcon />
          {isRecording ? 'Recording...' : 'Record'}
        </Button>

        <Button
          icon
          variant="standard"
          outlined={hmsDiagnostics.getRecordedAudio() === TEST_AUDIO_URL}
          onClick={() => {
            if (audioRef.current) {
              audioRef.current.src = hmsDiagnostics.getRecordedAudio() || '';
              audioRef.current.play();
            }
          }}
          disabled={playing || hmsDiagnostics.getRecordedAudio() === TEST_AUDIO_URL}
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

      <Flex align="center" css={{ mt: '$4', maxWidth: '10rem', opacity: isRecording ? '1' : '0', gap: '$4' }}>
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
      </Flex>
    </SelectContainer>
  );
};

const SpeakerTest = () => {
  const actions = useHMSActions();
  const devices = useHMSStore(selectDevices);
  const { audioOutputDeviceId } = useHMSStore(selectLocalMediaSettings);
  const isMobile = useMedia(cssConfig.media.md);

  if (isMobile || isSafari) {
    return <></>;
  }

  return (
    <SelectContainer>
      <DeviceSelector
        title="Speaker (Output)"
        devices={devices.audioOutput}
        selection={audioOutputDeviceId || 'default'}
        icon={<SpeakerIcon />}
        onChange={(deviceId: string) => {
          actions.setAudioOutputDevice(deviceId);
        }}
      />
    </SelectContainer>
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
          Record a 10 second audio clip and play it back to check that your microphone and speaker are working. If they
          aren't, make sure your volume is turned up, try a different speaker or microphone, or check your bluetooth
          settings.
        </Text>

        <Flex
          css={{
            mt: '$10',
            gap: '$10',
            '@lg': {
              flexDirection: 'column',
              gap: '$8',
            },
          }}
        >
          {!error && <MicTest />}
          <SpeakerTest />
        </Flex>
      </TestContainer>
      <TestFooter error={error} ctaText="Does your audio sound good?" />
    </>
  );
};

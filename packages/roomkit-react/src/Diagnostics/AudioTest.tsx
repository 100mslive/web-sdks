/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import { DeviceCheckReturn } from '@100mslive/hms-video-store';
import { selectDevices, useHMSStore } from '@100mslive/react-sdk';
import { MicOnIcon, SpeakerIcon } from '@100mslive/react-icons';
import { Button } from '../Button';
import { Box, Flex } from '../Layout';
import { Text } from '../Text';
// @ts-ignore: No implicit any
import { DeviceSelector } from './DeviceSelector';
import { hmsDiagnostics } from './hms';
import { useAudioOutputTest } from '../Prebuilt/components/hooks/useAudioOutputTest';
import { TEST_AUDIO_URL } from '../Prebuilt/common/constants';

const MicTest = () => {
  const devices = useHMSStore(selectDevices);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedMic, setSelectedMic] = useState(devices.audioInput[0]?.deviceId);

  const [checkResult, setCheckResult] = useState<DeviceCheckReturn>();

  return (
    <Box css={{ w: '50%' }}>
      <DeviceSelector
        title="Microphone(Input)"
        devices={devices.audioInput}
        selection={selectedMic}
        icon={<MicOnIcon />}
        onChange={(deviceId: string) => {
          checkResult?.stop();
          setSelectedMic(deviceId);
        }}
      />
      <Button
        onClick={() =>
          hmsDiagnostics.startMicCheck(selectedMic).then(result => {
            setCheckResult(result);
            result.track.nativeTrack.onended = () => {
              setIsRecording(false);
            };
            setIsRecording(true);
          })
        }
      >
        {isRecording ? 'Recording...' : 'Record'}
      </Button>
    </Box>
  );
};

const SpeakerTest = () => {
  const devices = useHMSStore(selectDevices);
  const [selectedSpeaker, setSelectedSpeaker] = useState(devices.audioOutput[0]?.deviceId);
  const { playing, setPlaying, audioRef } = useAudioOutputTest({ deviceId: selectedSpeaker });

  return (
    <Box css={{ w: '50%' }}>
      <DeviceSelector
        title="Speaker(output)"
        devices={devices.audioOutput}
        selection={selectedSpeaker}
        icon={<SpeakerIcon />}
        onChange={(deviceId: string) => {
          setSelectedSpeaker(deviceId);
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
  return (
    <Box>
      <Text variant="body2" css={{ c: '$on_primary_medium' }}>
        Record an audio clip and play it back to check that your microphone and speaker are working. If they aren't,
        make sure your volume is turned up, try a different speaker or microphone, or check your bluetooth settings.
      </Text>

      <Flex css={{ mt: '$10', gap: '$10' }}>
        <MicTest />
        <SpeakerTest />
      </Flex>
    </Box>
  );
};

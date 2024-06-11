import React, { useEffect, useState } from 'react';
import { selectDevices, selectLocalMediaSettings, useHMSStore } from '@100mslive/react-sdk';
import { VideoOnIcon } from '@100mslive/react-icons';
import { Flex } from '../Layout';
import { Text } from '../Text';
import { Video } from '../Video';
import { StyledVideoTile } from '../VideoTile';
// @ts-ignore: No implicit any
import { DeviceSelector } from './DeviceSelector';
import { hmsDiagnostics } from './hms';

export const VideoTest = () => {
  const allDevices = useHMSStore(selectDevices);
  const { videoInput } = allDevices;
  const [trackId, setTrackId] = useState<string>();
  const sdkSelectedDevices = useHMSStore(selectLocalMediaSettings);

  useEffect(() => {
    (async () => {
      const { track } = await hmsDiagnostics.startCameraCheck();
      setTrackId(track.trackId);
    })();
  }, []);
  return (
    <Flex>
      {trackId && (
        <StyledVideoTile.Container
          css={{
            w: '90%',
            px: '$10',
            height: '$48',
            bg: 'transparent',
            m: '$10 auto',
          }}
        >
          <Video trackId={trackId} />
        </StyledVideoTile.Container>
      )}
      <Flex direction="column">
        <Text variant="md">
          Move in front of your camera to make sure it's working. If you don't see your video, try changing the selected
          camera. If the camera isn't part of your computer, check your settings to make sure your system recognizes it.
        </Text>
        <DeviceSelector
          title="Video"
          devices={videoInput || []}
          icon={<VideoOnIcon />}
          selection={sdkSelectedDevices.videoInputDeviceId}
          onChange={async (deviceId: string) => {
            const { track } = await hmsDiagnostics.startCameraCheck(deviceId);
            setTrackId(track.trackId);
          }}
        />
      </Flex>
    </Flex>
  );
};

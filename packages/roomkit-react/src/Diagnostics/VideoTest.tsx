import React, { useEffect, useState } from 'react';
import { DeviceCheckReturn, selectDevices, selectLocalMediaSettings, useHMSStore } from '@100mslive/react-sdk';
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
  const [checkResult, setCheckResult] = useState<DeviceCheckReturn>();
  const sdkSelectedDevices = useHMSStore(selectLocalMediaSettings);

  useEffect(() => {
    hmsDiagnostics.startCameraCheck().then(result => {
      setCheckResult(result);
    });
  }, []);

  return (
    <Flex>
      {checkResult?.track && (
        <StyledVideoTile.Container
          css={{
            w: '90%',
            height: '$48',
          }}
        >
          <Video mirror={true} trackId={checkResult.track.trackId} />
        </StyledVideoTile.Container>
      )}
      <Flex direction="column" css={{ ml: '$10' }}>
        <Text variant="body2" css={{ c: '$on_primary_medium', mb: '$10' }}>
          Move in front of your camera to make sure it's working. If you don't see your video, try changing the selected
          camera. If the camera isn't part of your computer, check your settings to make sure your system recognizes it.
        </Text>
        <DeviceSelector
          title="Video"
          devices={videoInput || []}
          icon={<VideoOnIcon />}
          selection={sdkSelectedDevices.videoInputDeviceId}
          onChange={async (deviceId: string) => {
            checkResult?.stop();
            hmsDiagnostics.startCameraCheck(deviceId).then(result => setCheckResult(result));
          }}
        />
      </Flex>
    </Flex>
  );
};

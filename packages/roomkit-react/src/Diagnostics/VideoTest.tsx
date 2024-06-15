import React, { useEffect, useState } from 'react';
import { selectDevices, selectLocalMediaSettings, selectLocalVideoTrackID, useHMSStore } from '@100mslive/react-sdk';
import { VideoOnIcon } from '@100mslive/react-icons';
import { TestContainer, TestFooter } from './components';
import { Button } from '../Button';
import { Flex } from '../Layout';
import { Text } from '../Text';
import { Video } from '../Video';
import { StyledVideoTile } from '../VideoTile';
// @ts-ignore: No implicit any
import { DeviceSelector } from './DeviceSelector';
import { hmsDiagnostics } from './hms';

export const VideoTest = ({ onNextStep }: { onNextStep: () => void }) => {
  const allDevices = useHMSStore(selectDevices);
  const { videoInput } = allDevices;
  const trackID = useHMSStore(selectLocalVideoTrackID);
  const sdkSelectedDevices = useHMSStore(selectLocalMediaSettings);
  const [error, setError] = useState<Error | undefined>();

  useEffect(() => {
    hmsDiagnostics.startCameraCheck().catch(err => setError(err));
  }, []);

  return (
    <>
      <TestContainer css={{ display: 'flex' }}>
        {trackID && (
          <StyledVideoTile.Container
            css={{
              w: '90%',
              height: '$48',
              mr: '$10',
            }}
          >
            <Video mirror={true} trackId={trackID} />
          </StyledVideoTile.Container>
        )}
        <Flex direction="column">
          <Text variant="body2" css={{ c: '$on_primary_medium', mb: '$10' }}>
            Move in front of your camera to make sure it's working. If you don't see your video, try changing the
            selected camera. If the camera isn't part of your computer, check your settings to make sure your system
            recognizes it.
          </Text>
          <DeviceSelector
            title="Video"
            devices={videoInput || []}
            icon={<VideoOnIcon />}
            selection={sdkSelectedDevices.videoInputDeviceId}
            onChange={async (deviceId: string) => {
              hmsDiagnostics.stopCameraCheck();
              hmsDiagnostics.startCameraCheck(deviceId);
            }}
          />
        </Flex>
      </TestContainer>
      <TestFooter error={error}>
        <Flex align="center" gap="4">
          <Text css={{ c: '$on_primary_medium' }}>Does your video look good?</Text>
          <Button variant="standard" outlined={true}>
            No
          </Button>
          <Button onClick={onNextStep}>Yes</Button>
        </Flex>
      </TestFooter>
    </>
  );
};

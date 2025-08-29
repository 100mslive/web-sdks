import React, { useEffect, useState } from 'react';
import {
  HMSException,
  selectDevices,
  selectLocalMediaSettings,
  selectLocalVideoTrackID,
  useHMSStore,
} from '@100mslive/react-sdk';
import { VideoOnIcon } from '@100mslive/react-icons';
import { PermissionErrorModal } from '../Prebuilt/components/Notifications/PermissionErrorModal';
import { TestContainer, TestFooter } from './components';
import { Flex } from '../Layout';
import { Text } from '../Text';
import { Video } from '../Video';
import { StyledVideoTile } from '../VideoTile';
// @ts-ignore: No implicit any
import { DeviceSelector } from './DeviceSelector';
import { DiagnosticsStep, useDiagnostics } from './DiagnosticsContext';

export const VideoTest = () => {
  const { hmsDiagnostics, updateStep } = useDiagnostics();
  const allDevices = useHMSStore(selectDevices);
  const { videoInput } = allDevices;
  const trackID = useHMSStore(selectLocalVideoTrackID);
  const sdkSelectedDevices = useHMSStore(selectLocalMediaSettings);
  const [error, setError] = useState<HMSException | undefined>();

  useEffect(() => {
    hmsDiagnostics?.startCameraCheck().catch(err => {
      updateStep(DiagnosticsStep.VIDEO, { hasFailed: true });
      setError(err);
    });
  }, [hmsDiagnostics, updateStep]);

  return (
    <>
      <TestContainer css={{ display: 'flex', containerLg: { flexDirection: 'column', alignItems: 'center' } }}>
        {trackID && (
          <StyledVideoTile.Container
            css={{
              width: '90%',
              aspectRatio: '16/9',
              mr: '$10',
              containerLg: { mr: 0, mb: '$10', aspectRatio: '1/1' },
            }}
          >
            <Video mirror={true} trackId={trackID} />
          </StyledVideoTile.Container>
        )}
        <Flex direction="column" css={{ w: '100%' }}>
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
              hmsDiagnostics?.stopCameraCheck();
              hmsDiagnostics?.startCameraCheck(deviceId);
            }}
          />
        </Flex>
      </TestContainer>
      <TestFooter error={error} ctaText="Does your video look good?" />
      <PermissionErrorModal error={error} />
    </>
  );
};

import React, { Fragment } from 'react';
import {
  DeviceType,
  selectIsLocalVideoEnabled,
  selectLocalVideoTrackID,
  selectVideoTrackByID,
  useDevices,
  useHMSStore,
} from '@100mslive/react-sdk';
import { VideoOnIcon } from '@100mslive/react-icons';
import { Video } from '../Video';
import { StyledVideoTile } from '../VideoTile';
// @ts-ignore: No implicit any
import { DeviceSelector } from './DeviceSelector';

export const VideoTest = () => {
  const { allDevices, selectedDeviceIDs, updateDevice } = useDevices();
  const { videoInput } = allDevices;
  const videoTrackId = useHMSStore(selectLocalVideoTrackID);

  const isVideoOn = useHMSStore(selectIsLocalVideoEnabled);
  const trackSelector = selectVideoTrackByID(videoTrackId);
  const track = useHMSStore(trackSelector);

  return (
    <Fragment>
      {isVideoOn && (
        <StyledVideoTile.Container
          css={{
            w: '90%',
            px: '$10',
            height: '$48',
            bg: 'transparent',
            m: '$10 auto',
          }}
        >
          <Video trackId={videoTrackId} mirror={track?.facingMode !== 'environment'} />
        </StyledVideoTile.Container>
      )}
      <DeviceSelector
        title="Video"
        devices={videoInput || []}
        icon={<VideoOnIcon />}
        selection={selectedDeviceIDs.videoInput}
        onChange={(deviceId: string) =>
          updateDevice({
            deviceId,
            deviceType: DeviceType.videoInput,
          })
        }
      />
    </Fragment>
  );
};

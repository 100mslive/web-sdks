import React, { Fragment } from 'react';
import {
  DeviceType,
  selectLocalVideoTrackID,
  selectVideoTrackByID,
  useAVToggle,
  useDevices,
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';
import { CameraFlipIcon, MicOffIcon, MicOnIcon, VideoOffIcon, VideoOnIcon } from '@100mslive/react-icons';
import { IconButtonWithOptions } from './IconButtonWithOptions/IconButtonWithOptions';
import { ToastManager } from './Toast/ToastManager';
import { Text } from '../../Text';
import { Tooltip } from '../../Tooltip';
import IconButton from '../IconButton';
import { isMacOS } from '../common/constants';

export const AudioVideoToggle = () => {
  const { allDevices, selectedDeviceIDs, updateDevice } = useDevices();
  const { videoInput, audioInput } = allDevices;

  const formattedVideoInputList = videoInput?.map(videoInput => ({
    active: selectedDeviceIDs.videoInput === videoInput.deviceId,
    content: (
      <Text
        variant="sm"
        onClick={() =>
          updateDevice({
            deviceType: DeviceType.videoInput,
            deviceId: videoInput.deviceId,
          })
        }
        css={{ fontWeight: '$semiBold', color: '$textHighEmp' }}
      >
        {videoInput.label}
      </Text>
    ),
    title: videoInput.label,
  }));

  const formattedAudioInputList = audioInput?.map(audioInput => ({
    active: selectedDeviceIDs.audioInput === audioInput.deviceId,
    content: (
      <Text
        variant="sm"
        onClick={() =>
          updateDevice({
            deviceType: DeviceType.audioInput,
            deviceId: audioInput.deviceId,
          })
        }
        css={{ fontWeight: '$semiBold', color: '$textHighEmp' }}
      >
        {audioInput.label}
      </Text>
    ),
    title: audioInput.label,
  }));

  const { isLocalVideoEnabled, isLocalAudioEnabled, toggleAudio, toggleVideo } = useAVToggle();
  const actions = useHMSActions();
  const videoTracKId = useHMSStore(selectLocalVideoTrackID);
  const localVideoTrack = useHMSStore(selectVideoTrackByID(videoTracKId));

  return (
    <Fragment>
      {toggleAudio ? (
        <IconButtonWithOptions
          options={formattedAudioInputList}
          tooltipMessage={`Turn ${isLocalAudioEnabled ? 'off' : 'on'} audio (${isMacOS ? '⌘' : 'ctrl'} + d)`}
          icon={
            !isLocalAudioEnabled ? <MicOffIcon data-testid="audio_off_btn" /> : <MicOnIcon data-testid="audio_on_btn" />
          }
          active={isLocalAudioEnabled}
          onClick={toggleAudio}
          key="toggleAudio"
        />
      ) : null}

      {toggleVideo ? (
        <IconButtonWithOptions
          options={formattedVideoInputList}
          tooltipMessage={`Turn ${isLocalVideoEnabled ? 'off' : 'on'} video (${isMacOS ? '⌘' : 'ctrl'} + e)`}
          icon={
            !isLocalVideoEnabled ? (
              <VideoOffIcon data-testid="video_off_btn" />
            ) : (
              <VideoOnIcon data-testid="video_on_btn" />
            )
          }
          key="toggleVideo"
          active={isLocalVideoEnabled}
          onClick={toggleVideo}
        />
      ) : null}
      {localVideoTrack?.facingMode ? (
        <Tooltip title="Switch Camera" key="switchCamera">
          <IconButton
            onClick={async () => {
              try {
                await actions.switchCamera();
              } catch (e) {
                ToastManager.addToast({
                  title: `Error while flipping camera ${e.message || ''}`,
                  variant: 'error',
                });
              }
            }}
          >
            <CameraFlipIcon />
          </IconButton>
        </Tooltip>
      ) : null}
    </Fragment>
  );
};

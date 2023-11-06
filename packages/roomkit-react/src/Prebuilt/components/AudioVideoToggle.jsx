import React, { Fragment, useEffect, useState } from 'react';
import {
  DeviceType,
  HMSRoomState,
  selectRoomState,
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

const optionsCSS = { fontWeight: '$semiBold', color: '$on_surface_high', w: '100%', p: '$8' };

export const AudioVideoToggle = ({ hideOptions = false }) => {
  const { allDevices, selectedDeviceIDs, updateDevice } = useDevices();
  const { videoInput, audioInput } = allDevices;
  const [hasFrontCam, setHasFrontCam] = useState(false);
  const [hasBackCam, setHasBackCam] = useState(false);

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
        css={optionsCSS}
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
        css={optionsCSS}
      >
        {audioInput.label}
      </Text>
    ),
    title: audioInput.label,
  }));

  const { isLocalVideoEnabled, isLocalAudioEnabled, toggleAudio, toggleVideo } = useAVToggle();
  const actions = useHMSActions();
  const roomState = useHMSStore(selectRoomState);
  const hasAudioDevices = audioInput?.length > 0;
  const hasVideoDevices = videoInput?.length > 0;

  useEffect(() => {
    videoInput.forEach(videoInput => {
      const facingMode = videoInput.getCapabilities().facingMode?.[0] || '';
      if (!hasBackCam && facingMode === 'environment') {
        setHasBackCam(true);
      }
      if (!hasFrontCam && facingMode === 'user') {
        setHasFrontCam(true);
      }
    });
    // eslint-disable-next-line
  }, [formattedVideoInputList]);

  return (
    <Fragment>
      {toggleAudio ? (
        hideOptions || !hasAudioDevices ? (
          <Tooltip title={`Turn ${isLocalAudioEnabled ? 'off' : 'on'} audio (${isMacOS ? '⌘' : 'ctrl'} + d)`}>
            <IconButton
              active={isLocalAudioEnabled}
              disabled={!toggleAudio}
              onClick={toggleAudio}
              key="toggleAudio"
              data-testid="audio_btn"
              className="__cancel-drag-event"
            >
              {!isLocalAudioEnabled ? (
                <MicOffIcon data-testid="audio_off_btn" />
              ) : (
                <MicOnIcon data-testid="audio_on_btn" />
              )}
            </IconButton>
          </Tooltip>
        ) : (
          <IconButtonWithOptions
            options={formattedAudioInputList}
            disabled={!toggleAudio}
            onDisabledClick={toggleAudio}
            tooltipMessage={`Turn ${isLocalAudioEnabled ? 'off' : 'on'} audio (${isMacOS ? '⌘' : 'ctrl'} + d)`}
            icon={
              !isLocalAudioEnabled ? (
                <MicOffIcon data-testid="audio_off_btn" />
              ) : (
                <MicOnIcon data-testid="audio_on_btn" />
              )
            }
            active={isLocalAudioEnabled}
            onClick={toggleAudio}
            key="toggleAudio"
          />
        )
      ) : null}

      {toggleVideo ? (
        hideOptions || !hasVideoDevices ? (
          <Tooltip title={`Turn ${isLocalVideoEnabled ? 'off' : 'on'} video (${isMacOS ? '⌘' : 'ctrl'} + e)`}>
            <IconButton
              key="toggleVideo"
              active={isLocalVideoEnabled}
              disabled={!toggleVideo}
              onClick={toggleVideo}
              data-testid="video_btn"
              className="__cancel-drag-event"
            >
              {!isLocalVideoEnabled ? (
                <VideoOffIcon data-testid="video_off_btn" />
              ) : (
                <VideoOnIcon data-testid="video_on_btn" />
              )}
            </IconButton>
          </Tooltip>
        ) : (
          <IconButtonWithOptions
            disabled={!toggleVideo}
            onDisabledClick={toggleVideo}
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
        )
      ) : null}

      {hasBackCam && hasFrontCam && roomState === HMSRoomState.Preview ? (
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

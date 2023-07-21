import React, { Fragment } from 'react';
import {
  selectLocalVideoTrackID,
  selectVideoTrackByID,
  useAVToggle,
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';
import { CameraFlipIcon, MicOffIcon, MicOnIcon, VideoOffIcon, VideoOnIcon } from '@100mslive/react-icons';
import { ToastManager } from './Toast/ToastManager';
import { Tooltip } from '../../Tooltip';
import IconButton from '../IconButton';
import { IconButtonWithOptions } from './IconButtonWithOptions/IconButtonWithOptions';
import { isMacOS } from '../common/constants';

export const AudioVideoToggle = () => {
  const { isLocalVideoEnabled, isLocalAudioEnabled, toggleAudio, toggleVideo } = useAVToggle();
  const actions = useHMSActions();
  const videoTracKId = useHMSStore(selectLocalVideoTrackID);
  const localVideoTrack = useHMSStore(selectVideoTrackByID(videoTracKId));

  return (
    <Fragment>
      {toggleAudio ? (
        <IconButtonWithOptions
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

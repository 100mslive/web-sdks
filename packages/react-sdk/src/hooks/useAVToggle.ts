import {
  selectIsAllowedToPublish,
  selectIsLocalAudioEnabled,
  selectIsLocalVideoEnabled,
} from '@100mslive/hms-video-store';
import { useCallback } from 'react';
import { useHMSActions, useHMSStore } from './HmsRoomProvider';
import { logErrorHandler } from '../utils/commons';

/**
 * Use this hook to implement mute/unmute for audio and video.
 * isAllowedToPublish can be used to decide whether to show the toggle buttons in the UI.
 */
export const useAVToggle = ({ handleError } = { handleError: logErrorHandler }) => {
  const isLocalAudioEnabled = useHMSStore(selectIsLocalAudioEnabled);
  const isLocalVideoEnabled = useHMSStore(selectIsLocalVideoEnabled);
  const isAllowedToPublish = useHMSStore(selectIsAllowedToPublish);
  const hmsActions = useHMSActions();

  const toggleAudio = useCallback(async () => {
    try {
      await hmsActions.setLocalAudioEnabled(!isLocalAudioEnabled);
    } catch (err) {
      handleError(err as Error, 'toggleAudio');
    }
  }, [isLocalAudioEnabled, hmsActions]);

  const toggleVideo = useCallback(async () => {
    try {
      await hmsActions.setLocalVideoEnabled(!isLocalVideoEnabled);
    } catch (err) {
      handleError(err as Error, 'toggleVideo');
    }
  }, [isLocalVideoEnabled, hmsActions]);

  return {
    isLocalAudioEnabled,
    isLocalVideoEnabled,
    toggleAudio,
    toggleVideo,
    isAllowedToPublish,
  };
};

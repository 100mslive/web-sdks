import {
  selectIsAllowedToPublish,
  selectIsLocalAudioEnabled,
  selectIsLocalVideoEnabled,
} from '@100mslive/hms-video-store';
import { useHMSActions, useHMSStore } from '../primitives/HmsRoomProvider';
import { logErrorHandler } from '../utils/commons';
import { hooksErrHandler } from '../hooks/types';

export interface useAVToggleResult {
  /**
   * true if unmuted and vice versa
   */
  isLocalAudioEnabled: boolean;
  isLocalVideoEnabled: boolean;
  /**
   * use this function to toggle audio state, the function will only be present if the user
   * has permission to unmute audio
   */
  toggleAudio?: () => void;
  /**
   * use this function to toggle video state, the function will only be present if the user
   * has permission to unmute video
   */
  toggleVideo?: () => void;
}

/**
 * Use this hook to implement mute/unmute for audio and video.
 * isAllowedToPublish can be used to decide whether to show the toggle buttons in the UI.
 * @param handleError to handle any error during toggle of audio/video
 */
export const useAVToggle = (handleError: hooksErrHandler = logErrorHandler): useAVToggleResult => {
  const isLocalAudioEnabled = useHMSStore(selectIsLocalAudioEnabled);
  const isLocalVideoEnabled = useHMSStore(selectIsLocalVideoEnabled);
  const isAllowedToPublish = useHMSStore(selectIsAllowedToPublish);
  const actions = useHMSActions();

  const toggleAudio = async () => {
    try {
      await actions.setLocalAudioEnabled(!isLocalAudioEnabled);
    } catch (err) {
      handleError(err as Error, 'toggleAudio');
    }
  };

  const toggleVideo = async () => {
    try {
      await actions.setLocalVideoEnabled(!isLocalVideoEnabled);
    } catch (err) {
      handleError(err as Error, 'toggleVideo');
    }
  };

  return {
    isLocalAudioEnabled,
    isLocalVideoEnabled,
    toggleAudio: isAllowedToPublish?.audio ? toggleAudio : undefined,
    toggleVideo: isAllowedToPublish?.video ? toggleVideo : undefined,
  };
};

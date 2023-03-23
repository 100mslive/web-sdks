import { useCallback } from 'react';
import {
  selectIsAllowedToPreviewMedia,
  selectIsAllowedToPublish,
  selectIsInPreview,
  selectIsLocalAudioEnabled,
  selectIsLocalVideoEnabled,
} from '@100mslive/hms-video-store';
import { hooksErrHandler } from '../hooks/types';
import { useHMSActions, useHMSStore } from '../primitives/HmsRoomProvider';
import { logErrorHandler } from '../utils/commons';

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
  const isInPreview = useHMSStore(selectIsInPreview);
  const selectAllowed = isInPreview ? selectIsAllowedToPreviewMedia : selectIsAllowedToPublish;
  const isAllowedToPublish = useHMSStore(selectAllowed);
  const actions = useHMSActions();

  const toggleAudio = useCallback(async () => {
    try {
      await actions.setLocalAudioEnabled(!isLocalAudioEnabled);
    } catch (err) {
      handleError(err as Error, 'toggleAudio');
    }
  }, [actions, isLocalAudioEnabled, handleError]);

  const toggleVideo = useCallback(async () => {
    try {
      await actions.setLocalVideoEnabled(!isLocalVideoEnabled);
    } catch (err) {
      handleError(err as Error, 'toggleVideo');
    }
  }, [actions, isLocalVideoEnabled, handleError]);

  return {
    isLocalAudioEnabled,
    isLocalVideoEnabled,
    toggleAudio: isAllowedToPublish?.audio ? toggleAudio : undefined,
    toggleVideo: isAllowedToPublish?.video ? toggleVideo : undefined,
  };
};

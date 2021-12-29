import {
  selectIsAllowedToPublish,
  selectIsLocalAudioEnabled,
  selectIsLocalVideoEnabled,
} from '@100mslive/hms-video-store';
import { useCallback } from 'react';
import { useHMSActions, useHMSStore } from './HmsRoomProvider';

export const useAVToggle = () => {
  const isLocalAudioEnabled = useHMSStore(selectIsLocalAudioEnabled);
  const isLocalVideoEnabled = useHMSStore(selectIsLocalVideoEnabled);
  const isAllowedToPublish = useHMSStore(selectIsAllowedToPublish);
  const hmsActions = useHMSActions();

  const toggleAudio = useCallback(async () => {
    try {
      await hmsActions.setLocalAudioEnabled(!isLocalAudioEnabled);
    } catch (err) {
      console.error('Cannot toggle audio', err);
    }
  }, [isLocalAudioEnabled]); //eslint-disable-line

  const toggleVideo = useCallback(async () => {
    try {
      await hmsActions.setLocalVideoEnabled(!isLocalVideoEnabled);
    } catch (err) {
      console.error('Cannot toggle video', err);
    }
  }, [isLocalVideoEnabled]); //eslint-disable-line

  return {
    isLocalAudioEnabled,
    isLocalVideoEnabled,
    toggleAudio,
    toggleVideo,
    isAllowedToPublish,
  };
};

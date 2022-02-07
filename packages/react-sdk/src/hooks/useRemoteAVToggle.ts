import {
  HMSActions,
  HMSPeerID,
  HMSTrack,
  selectAudioTrackByPeerID,
  selectAudioTrackVolume,
  selectPermissions,
  selectVideoTrackByPeerID,
} from '@100mslive/hms-video-store';
import { useHMSActions, useHMSStore } from '../primitives/HmsRoomProvider';
import { useCallback } from 'react';
import { hooksErrHandler } from './types';
import { logErrorHandler } from '../utils/commons';

export interface useRemoteAVToggleResult {
  /**
   * true if unmuted and vice versa
   */
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  /**
   * current volume of the audio track
   */
  volume?: number;
  /**
   * use this function to toggle audio state, the function will only be present if the user
   * has permission to mute/unmute remote audio
   */
  toggleAudio?: () => void;
  /**
   * use this function to toggle video state, the function will only be present if the user
   * has permission to mute/unmute remote video
   */
  toggleVideo?: () => void;
  /**
   * use this function to set the volume of peer's audio track for the local user, the function will
   * only be present if the remote peer has an audio track to change volume for
   */
  setVolume?: (volume: number) => void;
}

const toggleTrackEnabled = async (actions: HMSActions, track: HMSTrack | undefined, handleError: hooksErrHandler) => {
  if (track) {
    try {
      await actions.setRemoteTrackEnabled(track.id, !track.enabled);
    } catch (err) {
      handleError(err as Error, 'remoteToggle');
    }
  }
};

/**
 * This hook can be used to implement remote mute/unmute + audio volume changer on tile level.
 * @param peerId of the peer whose tracks need to be managed
 * @param handleError to handle any error during toggle of audio/video
 */
export const useRemoteAVToggle = (
  peerId: HMSPeerID,
  handleError: hooksErrHandler = logErrorHandler,
): useRemoteAVToggleResult => {
  const actions = useHMSActions();
  const audioTrack = useHMSStore(selectAudioTrackByPeerID(peerId));
  const videoTrack = useHMSStore(selectVideoTrackByPeerID(peerId));
  const volume = useHMSStore(selectAudioTrackVolume(audioTrack?.id));
  const permissions = useHMSStore(selectPermissions);
  const canToggleVideo = videoTrack?.enabled ? permissions?.mute : permissions?.unmute;
  const canToggleAudio = audioTrack?.enabled ? permissions?.mute : permissions?.unmute;

  const toggleAudio = useCallback(async () => {
    await toggleTrackEnabled(actions, audioTrack, handleError);
  }, [actions, audioTrack, handleError]);

  const toggleVideo = useCallback(async () => {
    await toggleTrackEnabled(actions, videoTrack, handleError);
  }, [actions, audioTrack, handleError]);

  const setVolume = useCallback(
    (volume: number) => {
      if (audioTrack) {
        actions.setVolume(volume, audioTrack.id);
      }
    },
    [actions, audioTrack],
  );

  return {
    isAudioEnabled: !!audioTrack?.enabled,
    isVideoEnabled: !!videoTrack?.enabled,
    volume,
    toggleAudio: canToggleAudio ? toggleAudio : undefined,
    toggleVideo: canToggleVideo ? toggleVideo : undefined,
    setVolume: audioTrack ? setVolume : undefined,
  };
};

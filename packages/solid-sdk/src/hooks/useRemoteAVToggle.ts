/* eslint-disable complexity */
import {
  HMSActions,
  HMSTrack,
  HMSTrackID,
  selectAudioTrackVolume,
  selectPermissions,
  selectTrackByID,
} from '@100mslive/hms-video-store';
import { useHMSActions, useHMSStore } from '../primitives/HmsRoomProvider';
import { hooksErrHandler } from './types';
import { logErrorHandler } from '../utils/commons';
import { Accessor, createMemo } from 'solid-js';

export interface useRemoteAVToggleResult {
  /**
   * true if unmuted and vice versa
   */
  isAudioEnabled: Accessor<boolean>;
  isVideoEnabled: Accessor<boolean>;
  /**
   * current volume of the audio track
   */
  volume: Accessor<Accessor<number | undefined>>;
  /**
   * use this function to toggle audio state, the function will only be present if the user
   * has permission to mute/unmute remote audio
   */
  toggleAudio: Accessor<(() => void) | undefined>;
  /**
   * use this function to toggle video state, the function will only be present if the user
   * has permission to mute/unmute remote video
   */
  toggleVideo: Accessor<(() => void) | undefined>;
  /**
   * use this function to set the volume of peer's audio track for the local user, the function will
   * only be present if the remote peer has an audio track to change volume for
   */
  setVolume: Accessor<((volume: number) => void) | undefined>;
}

const toggleTrackEnabled = async (
  actions: HMSActions,
  track: HMSTrack | undefined | null,
  handleError: hooksErrHandler,
) => {
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
 * @param audioTrackId of the peer whose tracks need to be managed
 * @param videoTrackId of the peer whose tracks need to be managed
 * @param handleError to handle any error during toggle of audio/video
 */
export const useRemoteAVToggle = (
  audioTrackId: HMSTrackID,
  videoTrackId: HMSTrackID,
  handleError: hooksErrHandler = logErrorHandler,
): useRemoteAVToggleResult => {
  const actions = useHMSActions();
  const audioTrack = useHMSStore(selectTrackByID(audioTrackId));
  const videoTrack = useHMSStore(selectTrackByID(videoTrackId));
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const volume = createMemo(() => useHMSStore(selectAudioTrackVolume(audioTrack()?.id)));
  const permissions = useHMSStore(selectPermissions);
  const canToggleVideo = () => (videoTrack()?.enabled ? permissions()?.mute : permissions()?.unmute);
  const canToggleAudio = () => (audioTrack()?.enabled ? permissions()?.mute : permissions()?.unmute);

  const toggleAudio = async () => {
    await toggleTrackEnabled(actions, audioTrack(), handleError);
  };

  const toggleVideo = async () => {
    await toggleTrackEnabled(actions, videoTrack(), handleError);
  };

  const setVolume = (volume: number) => {
    if (audioTrack) {
      actions.setVolume(volume, audioTrack()?.id);
    }
  };

  return {
    isAudioEnabled: () => !!audioTrack()?.enabled,
    isVideoEnabled: () => !!videoTrack()?.enabled,
    volume,
    toggleAudio: () => (audioTrack() && canToggleAudio() ? toggleAudio : undefined),
    toggleVideo: () => (videoTrack()?.source === 'regular' && canToggleVideo() ? toggleVideo : undefined),
    setVolume: () => (audioTrack() ? setVolume : undefined),
  };
};

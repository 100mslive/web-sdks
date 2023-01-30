import { useCallback } from 'react';
import {
  HMSPeerID,
  HMSScreenShareConfig,
  HMSTrackID,
  selectIsLocalScreenShared,
  selectPeerScreenSharing,
  selectScreenSharesByPeerId,
} from '@100mslive/hms-video-store';
import { hooksErrHandler } from '../hooks/types';
import { useHMSActions, useHMSStore } from '../primitives/HmsRoomProvider';
import { logErrorHandler } from '../utils/commons';

export interface useScreenShareResult {
  /**
   * true if the local user is sharing screen, false otherwise
   */
  amIScreenSharing: boolean;
  /**
   * toggle screenshare for the local user, will only be present if the user has the permission to toggle
   */
  toggleScreenShare?: (config?: HMSScreenShareConfig) => Promise<void>;
  /**
   * the id of the peer who is currently sharing screen, will only be present if there is a screenshare in the room.
   * In case of multiple screenshares, the behaviour of which one is picked is not defined.
   */
  screenSharingPeerId?: HMSPeerID;
  /**
   * the name of the peer who is currently sharing screen. Will be undefined if no one is sharing the screen.
   * In case of multiple screenshares, the behavior of which one is picked is not defined.
   */
  screenSharingPeerName?: string;
  /**
   * screenShare audio track id, will only be present if there is a screenshare with video track
   */
  screenShareVideoTrackId?: HMSTrackID;
  /**
   * screenShare audio track id, will only be present if there is a screenshare with audio track
   */
  screenShareAudioTrackId?: HMSTrackID;
}

/**
 * This hook can be used to implement a screenshare toggle button as well as know about the screenshare in the room.
 * This works best if your application only needs to show one screenshare in large view at a time with other screenshares
 * similar to normal user tiles.
 * For any complicated requirement with multiple screenshares it's best to use the store directly.
 * For viewing the screenshare this hook is best used in combination with useVideo.
 * For implementing control bar for local peer, this is used based with useAVToggle.
 * @param handleError to handle any errors during screenshare toggle
 */
export const useScreenShare = (handleError: hooksErrHandler = logErrorHandler): useScreenShareResult => {
  const actions = useHMSActions();
  const amIScreenSharing = useHMSStore(selectIsLocalScreenShared);
  const screenSharePeer = useHMSStore(selectPeerScreenSharing);
  const screenShare = useHMSStore(selectScreenSharesByPeerId(screenSharePeer?.id));

  const toggleScreenShare = useCallback(
    async (config?: HMSScreenShareConfig) => {
      try {
        await actions.setScreenShareEnabled(!amIScreenSharing, config);
      } catch (err) {
        handleError(err as Error, 'toggleScreenShare');
      }
    },
    [actions, amIScreenSharing, handleError],
  );

  return {
    amIScreenSharing,
    screenSharingPeerId: screenSharePeer?.id,
    screenSharingPeerName: screenSharePeer?.name,
    screenShareVideoTrackId: screenShare?.video?.id,
    screenShareAudioTrackId: screenShare?.audio?.id,
    toggleScreenShare,
  };
};

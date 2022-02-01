import { hooksErrHandler } from '../hooks/types';
import {
  HMSPeerID,
  HMSTrackID,
  selectIsLocalScreenShared,
  selectPeerScreenSharing,
  selectPeerSharingAudio,
} from '@100mslive/react-sdk';
import { useHMSActions, useHMSStore } from '../primitives/HmsRoomProvider';

export interface useScreenShareResult {
  /**
   * true if the local user is screensharing, false otherwise
   */
  amIScreenSharing: boolean;
  /**
   * toggle screenshare for the local user, will only be present if the user has the permission to toggle
   */
  toggleScreenShare?: () => void;
  /**
   * the id of the peer who is currently screensharing, will only be present if there is a screenshare in the room.
   * In case of multiple screenshares, the behaviour of which one is picked is not defined.
   */
  screenSharingPeerId?: HMSPeerID;
  /**
   * screenShare audio track id, will only be present if there is a screenshare with video track
   */
  screenShareVideoTrackId?: HMSTrackID;
  /**
   * screenShare audio track id, will only be present if there is a screenshare with audio track
   */
  screenShareAudioTrackId?: HMSTrackID;
}

const logErrorHandler = (e: Error) => console.log('Error: ', e);

/**
 * This hook can be used to implement a screenshare toggle button as well as know about the screenshare in the room.
 * This works best if your application only needs to show one screenshare in large view at a time with other screenshares
 * similar to normal user tiles.
 * For any complicated requirement with multiple screenshares it's best to use the store directly.
 * For viewing the screenshare this hook is best used in combination with useVideo.
 * For implementing control bar for local peer, this is used based with useAVToggle.
 * @param handleError
 */
export const useScreenShare = (handleError: hooksErrHandler = logErrorHandler): useScreenShareResult => {
  const action = useHMSActions();
  const amIScreenSharing = useHMSStore(selectIsLocalScreenShared);
  const toggleScreenShare = () => {
    try {
      action.setScreenShareEnabled(!amIScreenSharing);
    } catch (error) {
      handleError(error as Error);
    }
  };
  const screenSharePeer = useHMSStore(selectPeerScreenSharing);
  const screenShareVideoTrackId = screenSharePeer?.videoTrack;
  const audioSharePeer = useHMSStore(selectPeerSharingAudio);
  const screenShareAudioTrackId = audioSharePeer?.audioTrack;
  const screenSharingPeerId = screenSharePeer?.id;
  return {
    amIScreenSharing,
    toggleScreenShare,
    screenShareVideoTrackId,
    screenSharingPeerId,
    screenShareAudioTrackId,
  };
};

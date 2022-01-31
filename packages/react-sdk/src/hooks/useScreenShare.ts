import { hooksErrHandler } from './types';
import { logErrorHandler } from '../utils/commons';
import { HMSPeerID, HMSTrackID } from '@100mslive/hms-video-store';

export interface useScreenShareInput {
  /**
   * function to handle errors happening during manual device change
   */
  handleError?: hooksErrHandler;
}

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

/**
 * This hook can be used to implement a screenshare toggle button as well as know about the screenshare in the room.
 * This works best if your application only needs to show one screenshare in large view at a time. For any complicated
 * requirement with multiple screenshares it's best to use the store directly.
 * For viewing the screenshare this hook is best used in combination with useVideo.
 * For implementing control bar for local peer, this is used based with useAVToggle.
 * @param handleError
 */
// export const useScreenShare = ({ handleError = logErrorHandler }: useScreenShareInput): useScreenShareResult => {};

import { hooksErrHandler } from '../hooks/types';
import {
  HMSPeerID,
  HMSTrackID,
  selectIsLocalScreenShared,
  selectPeerScreenSharing,
  selectScreenSharesByPeerId,
} from '@100mslive/hms-video-store';
import { useHMSActions, useHMSStore } from '../primitives/HmsRoomProvider';
import { Accessor, createMemo } from 'solid-js';

export interface useScreenShareResult {
  /**
   * true if the local user is screensharing, false otherwise
   */
  amIScreenSharing: Accessor<boolean>;
  /**
   * toggle screenshare for the local user, will only be present if the user has the permission to toggle
   */
  toggleScreenShare: Accessor<(() => void) | undefined>;
  /**
   * the id of the peer who is currently screensharing, will only be present if there is a screenshare in the room.
   * In case of multiple screenshares, the behaviour of which one is picked is not defined.
   */
  screenSharingPeerId: Accessor<HMSPeerID | undefined>;
  /**
   * screenShare audio track id, will only be present if there is a screenshare with video track
   */
  screenShareVideoTrackId: Accessor<HMSTrackID | undefined>;
  /**
   * screenShare audio track id, will only be present if there is a screenshare with audio track
   */
  screenShareAudioTrackId: Accessor<HMSTrackID | undefined>;
}

const logErrorHandler = (e: Error) => console.log('Error: ', e);

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
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const screenShare = createMemo(() => useHMSStore(selectScreenSharesByPeerId(screenSharePeer()?.id)));

  const toggleScreenShare = async (audioOnly = false) => {
    try {
      await actions.setScreenShareEnabled(!amIScreenSharing(), audioOnly);
    } catch (error) {
      handleError(error as Error);
    }
  };

  return {
    amIScreenSharing,
    screenSharingPeerId: () => screenSharePeer()?.id,
    screenShareVideoTrackId: () => screenShare()()?.video?.id,
    screenShareAudioTrackId: () => screenShare()()?.audio?.id,
    toggleScreenShare: () => toggleScreenShare,
  };
};

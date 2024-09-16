import { useEffect } from 'react';
import { selectPeerScreenSharing, useHMSStore, useWhiteboard } from '@100mslive/react-sdk';

/**
 * close existing whiteboard when a screen is shared
 */
export const useCloseScreenshareWhiteboard = () => {
  const peerSharing = useHMSStore(selectPeerScreenSharing);
  const { isOwner: isWhiteboardOwner, toggle: toggleWhiteboard } = useWhiteboard();

  // if both screenshare and whiteboard are open, close the whiteboard
  useEffect(() => {
    if (isWhiteboardOwner && peerSharing) {
      toggleWhiteboard?.();
    }
  }, [isWhiteboardOwner, toggleWhiteboard, peerSharing]);
};

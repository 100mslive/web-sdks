import { useEffect } from 'react';
import { usePrevious } from 'react-use';
import { useScreenShare, useWhiteboard } from '@100mslive/react-sdk';

/**
 * close existing screenshare or whiteboard when the other is started
 */
export const useCloseScreenshareWhiteboard = () => {
  const { amIScreenSharing, screenSharingPeerId, toggleScreenShare } = useScreenShare();
  const { isOwner: isWhiteboardOwner, toggle: toggleWhiteboard } = useWhiteboard();
  const prevScreenSharer = usePrevious(screenSharingPeerId);
  const prevWhiteboardOwner = usePrevious(isWhiteboardOwner);

  // if both screenshare and whiteboard are open, close the one that was open earlier
  useEffect(() => {
    if (isWhiteboardOwner && screenSharingPeerId) {
      if (prevScreenSharer && amIScreenSharing && !prevWhiteboardOwner) {
        toggleScreenShare?.();
      } else if (prevWhiteboardOwner && !prevScreenSharer) {
        toggleWhiteboard?.();
      }
    }
  }, [
    isWhiteboardOwner,
    screenSharingPeerId,
    amIScreenSharing,
    prevScreenSharer,
    prevWhiteboardOwner,
    toggleScreenShare,
    toggleWhiteboard,
  ]);
};

import { useCallback, useEffect, useRef } from 'react';
import { useScreenShare } from './useScreenShare';
import { isChromiumBased } from '../utils/commons';

export interface useEmbedScreenShareResult {
  /**
   * used to start screen share
   * It throws error in given below scenarios:
   * 1. When url is not passed.
   * 2. Reference to a iframe or element is not at attached.
   * 3. Unable to start screen share
   */
  startShare: (value: string) => Promise<void>;

  /**
   * stop your screen share.
   */
  stopShare: () => Promise<void>;
  /**
   * am I sharing pdf annotator in a room
   */
  amISharing: boolean;

  /**
   * reference of iframe where pdf annotator will be launched
   */
  regionRef: React.RefObject<HTMLIFrameElement | null>;
}

export const useEmbedScreenShare = (): useEmbedScreenShareResult => {
  const regionRef = useRef<HTMLIFrameElement | null>(null);
  const handleScreenShareError = useCallback(() => {
    throw new Error('unable to start screen share');
  }, []);
  const inProgress = useRef(false);
  const { amIScreenSharing, toggleScreenShare } = useScreenShare(handleScreenShareError);

  const stopShare = useCallback(async () => {
    if (amIScreenSharing) {
      await toggleScreenShare?.(); // Stop screen sharing
      regionRef.current = null;
    }
  }, [amIScreenSharing, toggleScreenShare]);

  const startShare = useCallback(
    async (value: string) => {
      if (!value) {
        throw new Error('URL not found');
      }
      if (amIScreenSharing) {
        throw new Error('You are already sharing');
      }
      if (!regionRef.current) {
        throw new Error('Attach a reference `regionRef` to iframe for sharing');
      }
      if (!inProgress.current) {
        regionRef.current.src = value;
        inProgress.current = true;
        await toggleScreenShare?.({
          forceCurrentTab: isChromiumBased,
          cropElement: regionRef.current,
          preferCurrentTab: isChromiumBased,
        });
        inProgress.current = false;
      }
    },
    [amIScreenSharing, toggleScreenShare],
  );

  useEffect(() => {
    return () => {
      // close screenshare when this component is being unmounted
      if (amIScreenSharing) {
        stopShare(); // stop
      }
    };
  }, [amIScreenSharing, stopShare]);

  return {
    startShare,
    stopShare,
    regionRef,
    amISharing: amIScreenSharing,
  };
};

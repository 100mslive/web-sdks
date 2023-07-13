import { useCallback, useEffect, useRef } from 'react';
import { useScreenShare } from './useScreenShare';
import usePrevious, { isChromiumBased } from '../utils/commons';

export interface useEmbedShareResult {
  /**
   * used to start screen share
   * It throws error in given below scenarios:
   * 1. When url is not passed.
   * 2. Reference to a iframe or element is not at attached.
   * 3. Unable to start screen share
   */
  startEmbedShare: (value: string) => Promise<void>;

  /**
   * stop your screen share.
   */
  stopEmbedShare: () => Promise<void>;
  /**
   * am I sharing embed view in a room
   */
  isEmbedShareInProgress: boolean;

  /**
   * reference of iframe where embed url will be launched
   */
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

/**
 * @param resetConfig pass resetConfig where you were mounting the iframe, it will help to clear configuration when stop screen share occurs
 * @returns useEmbedShareResult
 */
export const useEmbedShare = (resetConfig?: () => void): useEmbedShareResult => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const handleScreenShareError = useCallback(() => {
    throw new Error('unable to start screen share');
  }, []);
  const inProgress = useRef(false);
  const { amIScreenSharing, toggleScreenShare } = useScreenShare(handleScreenShareError);
  // store previous state of screensharing, it will help to reset the config after screensharing stop.
  const previouslySharing = usePrevious(amIScreenSharing);

  const stopShare = useCallback(async () => {
    if (amIScreenSharing) {
      await toggleScreenShare?.(); // Stop screen sharing
      iframeRef.current = null;
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
      if (!iframeRef.current) {
        throw new Error('Attach a reference `iframeRef` to iframe for sharing');
      }
      if (!inProgress.current) {
        iframeRef.current.src = value;
        inProgress.current = true;
        await toggleScreenShare?.({
          forceCurrentTab: isChromiumBased,
          cropElement: iframeRef.current,
          preferCurrentTab: isChromiumBased,
        });
        inProgress.current = false;
      }
    },
    [amIScreenSharing, toggleScreenShare],
  );

  useEffect(() => {
    if (previouslySharing && !amIScreenSharing) {
      resetConfig?.();
      if (iframeRef.current) {
        iframeRef.current.src = '';
        iframeRef.current = null;
      }
    }
  }, [amIScreenSharing, previouslySharing, resetConfig]);

  return {
    startEmbedShare: startShare,
    stopEmbedShare: stopShare,
    iframeRef,
    isEmbedShareInProgress: amIScreenSharing,
  };
};

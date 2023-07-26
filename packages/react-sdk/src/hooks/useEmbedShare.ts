import { useCallback, useEffect, useRef, useState } from 'react';
import { useScreenShare } from './useScreenShare';
import usePrevious, { isChromiumBased } from '../utils/commons';

export interface useEmbedShareResult {
  /**
   * Embed and start sharing a URL.
   *
   * It will throw an error in the following scenarios:
   * - When the URL has not been passed
   * - When the reference has not been attached to an iframe
   * - When screen share cannot be started
   */
  startEmbedShare: (value: string) => Promise<void>;

  /**
   * Stop sharing the embed.
   */
  stopEmbedShare: () => Promise<void>;
  /**
   * Flag to check if an embed is currently being shared.
   */
  isEmbedShareInProgress: boolean;

  /**
   * Reference to attach to the iframe that is responsible for rendering the URL passed.
   */
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

/**
 * @param resetConfig Callback that implements cleanup after Embed sharing stops. It is an optional parameter.
 * @returns useEmbedShareResult
 */
export const useEmbedShare = (resetConfig?: () => void): useEmbedShareResult => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [sharing, setSharing] = useState(false);

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
      if (inProgress.current) {
        return;
      }
      if (!value) {
        throw new Error('URL not found');
      }
      if (amIScreenSharing) {
        throw new Error('You are already sharing');
      }
      if (!iframeRef.current) {
        throw new Error('Attach a reference `iframeRef` to iframe for sharing');
      }
      iframeRef.current.src = value;
      inProgress.current = true;
      setSharing(true);
      await toggleScreenShare?.({
        forceCurrentTab: isChromiumBased,
        cropElement: iframeRef.current,
        preferCurrentTab: isChromiumBased,
      });
    },
    [amIScreenSharing, toggleScreenShare],
  );

  useEffect(() => {
    if (previouslySharing && !amIScreenSharing) {
      resetConfig?.();
      if (iframeRef.current) {
        iframeRef.current.src = '';
      }
      inProgress.current = false;
      setSharing(false);
    }
  }, [amIScreenSharing, previouslySharing, resetConfig]);

  return {
    startEmbedShare: startShare,
    stopEmbedShare: stopShare,
    iframeRef,
    isEmbedShareInProgress: sharing,
  };
};

import { useCallback, useEffect, useRef } from 'react';
import { parsedUserAgent } from '@100mslive/hms-video-store';
import { useScreenShare } from './useScreenShare';

export interface useRegionCaptureScreenShareResult {
  /**
   * true if the local user is sharing screen, false otherwise
   */
  amIScreenSharing: boolean;

  /**
   * reference for region to be removed
   */
  regionRef: React.RefObject<HTMLDivElement | null>;

  /**
   * stop screen share
   */
  stopScreenShare: () => void;
}

export const useRegionCaptureScreenShare = (): useRegionCaptureScreenShareResult => {
  const { amIScreenSharing, toggleScreenShare } = useScreenShare();
  const regionRef = useRef<HTMLDivElement | null>(null);
  const screenShareAttemptInProgress = useRef(false);
  const isChrome = parsedUserAgent.getBrowser()?.name?.toLowerCase() === 'chrome';

  const stopScreenShare = useCallback(async () => {
    if (amIScreenSharing) {
      regionRef.current = null;
      await toggleScreenShare?.(); // Stop screen sharing
    }
  }, [amIScreenSharing, toggleScreenShare]);

  // Start screen sharing when the component is mounted and not already screen sharing
  useEffect(() => {
    (async () => {
      if (!amIScreenSharing && regionRef.current && !screenShareAttemptInProgress.current) {
        screenShareAttemptInProgress.current = true;
        await toggleScreenShare?.({
          forceCurrentTab: isChrome,
          cropElement: regionRef.current,
          preferCurrentTab: isChrome,
        });
        screenShareAttemptInProgress.current = false;
      }
    })();
  }, [amIScreenSharing, isChrome, toggleScreenShare]);

  return {
    amIScreenSharing,
    stopScreenShare,
    regionRef,
  };
};

import { useCallback, useRef, useState } from 'react';
import { parsedUserAgent } from '@100mslive/hms-video-store';
import { hooksErrHandler } from './types';
import { useScreenShare } from './useScreenShare';
import { logErrorHandler } from '../utils/commons';

export interface useIframeScreenShareResult {
  /**
   * true when screen share was tried even if unsuccessful, false otherwise
   */
  wasScreenShared: boolean;
  /**
   * true if the local user is sharing screen, false otherwise
   */
  amIScreenSharing: boolean;
  /**
   * stop screen share
   */
  stopScreenShare: () => void;
  /**
   * start screen share
   */
  startScreenShare: () => void;
}

export const useIframeScreenShare = (
  pdfIframeRef: React.RefObject<HTMLIFrameElement>,
  _handleError: hooksErrHandler = logErrorHandler,
): useIframeScreenShareResult => {
  const { amIScreenSharing, toggleScreenShare } = useScreenShare(_handleError);
  const [wasScreenShared, setWasScreenShared] = useState(false);
  // to handle - https://github.com/facebook/react/issues/24502
  const screenShareAttemptInProgress = useRef(false);

  const isChrome = parsedUserAgent.getBrowser()?.name?.toLowerCase() === 'chrome';

  const stopScreenShare = useCallback(() => {
    if (wasScreenShared && amIScreenSharing) {
      toggleScreenShare?.(); // Stop screen sharing
    }
  }, [wasScreenShared, amIScreenSharing, toggleScreenShare]);
  // Start screen sharing when the component is mounted and not already screen sharing
  const startScreenShare = useCallback(() => {
    if (!amIScreenSharing && !wasScreenShared && !screenShareAttemptInProgress.current) {
      screenShareAttemptInProgress.current = true;
      toggleScreenShare?.({
        forceCurrentTab: isChrome,
        cropElement: pdfIframeRef.current || undefined,
        preferCurrentTab: isChrome,
      })
        .then(() => {
          setWasScreenShared(true); // Set the state to indicate screen sharing has started
        })
        .catch(err => {
          _handleError(err as Error, 'toggleScreenShare');
        })
        .finally(() => {
          screenShareAttemptInProgress.current = false;
        });
    }
  }, [_handleError, amIScreenSharing, isChrome, pdfIframeRef, toggleScreenShare, wasScreenShared]);

  return {
    wasScreenShared,
    amIScreenSharing,
    stopScreenShare,
    startScreenShare,
  };
};

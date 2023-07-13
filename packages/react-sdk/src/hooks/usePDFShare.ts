import { useCallback, useEffect, useRef, useState } from 'react';
import { useScreenShare } from './useScreenShare';
import usePrevious, { isChromiumBased, pdfIframeURL } from '../utils/commons';

export interface usePDFShareResult {
  /**
   * used to start screen share
   * It throws error in given below scenarios:
   * 1. When file or url is not passed.
   * 2. Reference to a iframe or element is not yet attached.
   * 3. Unable to start screen share
   */
  startPDFShare: (value: File | string) => Promise<void>;

  /**
   * stop your screen share.
   */
  stopPDFShare: () => Promise<void>;
  /**
   * am I sharing pdf annotator in a room
   */
  isPDFShareInProgress: boolean;

  /**
   * reference of iframe where pdf annotator will be launched
   */
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

/**
 * @param resetConfig pass resetConfig where you were mounting the iframe, it will help to clear configuration when stop screen share occurs
 * @returns usePDFShareResult
 */
export const usePDFShare = (resetConfig?: () => void): usePDFShareResult => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [sharing, setSharing] = useState(false);

  const handleScreenShareError = useCallback(() => {
    throw new Error('unable to start screen share');
  }, []);
  const inProgress = useRef(false);
  const { amIScreenSharing, toggleScreenShare } = useScreenShare(handleScreenShareError);
  // store previous state of screensharing, it will help to reset the config after screensharing stop.
  const previouslySharing = usePrevious(amIScreenSharing);

  const sendDataToPDFIframe = useCallback((file?: File) => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        {
          theme: 2, // dark theme -> 2, light theme -> 1
          file,
        },
        '*',
      );
    }
  }, []);

  const stopShare = useCallback(async () => {
    if (amIScreenSharing) {
      await toggleScreenShare?.(); // Stop screen sharing
    }
  }, [amIScreenSharing, toggleScreenShare]);

  const startShare = useCallback(
    // eslint-disable-next-line complexity
    async (value: File | string) => {
      if (inProgress.current) {
        return;
      }
      if (!value) {
        throw new Error('File or url not found');
      }
      if (amIScreenSharing) {
        throw new Error('You are already sharing');
      }
      if (!iframeRef.current) {
        throw new Error('Attach a reference `iframeRef` to iframe for sharing');
      }

      iframeRef.current.src = `${pdfIframeURL}${typeof value === 'string' ? `?file=${value}` : ''}`;
      iframeRef.current.onload = () => {
        requestAnimationFrame(() => {
          if (value instanceof File) {
            sendDataToPDFIframe(value);
          }
        });
      };
      inProgress.current = true;
      setSharing(true);
      await toggleScreenShare?.({
        forceCurrentTab: isChromiumBased,
        cropElement: iframeRef.current,
        preferCurrentTab: isChromiumBased,
      });
    },
    [amIScreenSharing, sendDataToPDFIframe, toggleScreenShare],
  );

  useEffect(() => {
    if (previouslySharing && !amIScreenSharing) {
      resetConfig?.();
      if (iframeRef.current) {
        iframeRef.current.removeAttribute('src');
      }
      inProgress.current = false;
      setSharing(false);
    }
  }, [amIScreenSharing, previouslySharing, resetConfig]);

  return {
    startPDFShare: startShare,
    stopPDFShare: stopShare,
    iframeRef,
    isPDFShareInProgress: sharing,
  };
};

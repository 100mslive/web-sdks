import { useCallback, useEffect, useRef, useState } from 'react';
import { useScreenShare } from './useScreenShare';
import usePrevious, { isChromiumBased, pdfIframeURL } from '../utils/commons';

export interface usePDFShareResult {
  /**
   * Start sharing a PDF file or URL.
   * It will throw an error in the following scenarios:
   * - When file or URL has not been passed, or is invalid
   * - When the reference has not been attached to an iframe
   * - When screen share cannot be started
   */
  startPDFShare: (value: File | string) => Promise<void>;

  /**
   * Stop sharing the PDF file or URL.
   */
  stopPDFShare: () => Promise<void>;
  /**
   * Flag to check if PDF sharing is currently in progress.
   */
  isPDFShareInProgress: boolean;

  /**
   * Reference to attach to the iframe that is responsible for rendering the PDF.
   */
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

/**
 * @param resetConfig  Callback that implements cleanup after PDF sharing stops. Typically used to reset the currently selected PDF file or URL in your state. It is an optional parameter.
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
      const isInsideIframe = window.self !== window.top;
      await toggleScreenShare?.({
        forceCurrentTab: isChromiumBased && !isInsideIframe,
        cropElement: iframeRef.current,
        preferCurrentTab: isChromiumBased && !isInsideIframe,
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

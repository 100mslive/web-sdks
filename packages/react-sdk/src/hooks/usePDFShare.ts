import { useCallback, useEffect, useRef } from 'react';
import { useScreenShare } from './useScreenShare';
import usePrevious, { isChromiumBased, isValidPDFUrl, pdfIframeURL } from '../utils/commons';

export interface usePDFShareResult {
  /**
   * used to start screen share
   * It throws error in given below scenarios:
   * 1. When file or url is not passed.
   * 2. Reference to a iframe or element is not yet attached.
   * 3. Url is invalid or does not have pdf.
   * 4. Unable to start screen share
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

  /**
   * validate your pdf url
   * It will throw error when url does not contain pdf.
   */
  isValidPDFUrl: (url: string) => Promise<boolean>;
}

/**
 * @param resetConfig pass resetConfig where you were mounting the iframe, it will help to clear configuration when stop screen share occurs
 * @returns usePDFShareResult
 */
export const usePDFShare = (resetConfig?: () => void): usePDFShareResult => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

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
      if (!value) {
        throw new Error('File or url not found');
      }
      if (amIScreenSharing) {
        throw new Error('You are already sharing');
      }
      if (typeof value === 'string') {
        // validate the url and throw error if failed.
        await isValidPDFUrl(value);
      }
      if (!iframeRef.current) {
        throw new Error('Attach a reference `iframeRef` to iframe for sharing');
      }
      if (!inProgress.current) {
        iframeRef.current.src = `${pdfIframeURL}${typeof value === 'string' ? `?file=${value}` : ''}`;
        iframeRef.current.onload = () => {
          requestAnimationFrame(() => {
            if (value instanceof File) {
              sendDataToPDFIframe(value);
            }
          });
        };
        inProgress.current = true;
        await toggleScreenShare?.({
          forceCurrentTab: isChromiumBased,
          cropElement: iframeRef.current,
          preferCurrentTab: isChromiumBased,
        });
        inProgress.current = false;
      }
    },
    [amIScreenSharing, sendDataToPDFIframe, toggleScreenShare],
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
    startPDFShare: startShare,
    stopPDFShare: stopShare,
    iframeRef,
    isPDFShareInProgress: amIScreenSharing,
    isValidPDFUrl,
  };
};

// set URL
// show pdf view
// start screene share

// stop screene share
// amIScreenSharing false
// clean URL
// amIsharing false
// usePrevious to check previous state

import { useCallback, useEffect, useRef } from 'react';
import { useScreenShare } from './useScreenShare';
import { isChromiumBased, isValidPDFUrl, pdfIframeURL } from '../utils/commons';

export interface usePDFAnnotatorResult {
  /**
   * used to start screen share
   * It throws error in given below scenarios:
   * 1. When file or url is not passed.
   * 2. Reference to a iframe or element is not yet attached.
   * 3. Url is invalid or does not have pdf.
   * 4. Unable to start screen share
   */
  startShare: (value: File | string) => Promise<void>;

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

export const usePDFAnnotator = (): usePDFAnnotatorResult => {
  const regionRef = useRef<HTMLIFrameElement | null>(null);

  const handleScreenShareError = useCallback(() => {
    throw new Error('unable to start screen share');
  }, []);
  const inProgress = useRef(false);
  const { amIScreenSharing, toggleScreenShare } = useScreenShare(handleScreenShareError);

  const sendDataToPDFIframe = useCallback((file?: File) => {
    if (regionRef.current) {
      regionRef.current.contentWindow?.postMessage(
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
      regionRef.current = null;
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
      if (!regionRef.current) {
        throw new Error('Attach a reference `regionRef` to iframe for sharing');
      }
      if (!inProgress.current) {
        regionRef.current.src = `${pdfIframeURL}${typeof value === 'string' ? `?file=${value}` : ''}`;
        regionRef.current.onload = () => {
          requestAnimationFrame(() => {
            if (value instanceof File) {
              sendDataToPDFIframe(value);
            }
          });
        };
        inProgress.current = true;
        await toggleScreenShare?.({
          forceCurrentTab: isChromiumBased,
          cropElement: regionRef.current,
          preferCurrentTab: isChromiumBased,
        });
        inProgress.current = false;
      }
    },
    [amIScreenSharing, sendDataToPDFIframe, toggleScreenShare],
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

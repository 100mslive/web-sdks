import { useCallback, useEffect, useRef } from 'react';
import { parsedUserAgent } from '@100mslive/hms-video-store';
import { usePDFConfig } from './usePDFConfig';
import { useScreenShare } from './useScreenShare';

const pdfIframeURL = 'https://pdf-annotation.100ms.live/generic/web/viewer.html';

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
  const regionRef = useRef<HTMLIFrameElement | null>(null);
  const inProgress = useRef(false);
  const isChrome = parsedUserAgent.getBrowser()?.name?.toLowerCase() === 'chrome';
  const { pdfConfig, resetValue } = usePDFConfig();

  const sendDataToPDFIframe = useCallback((file: File) => {
    if (regionRef.current) {
      regionRef.current.contentWindow?.postMessage(
        {
          theme: document.documentElement.className.includes('dark-theme') ? 2 : 1,
          file,
        },
        '*',
      );
    }
  }, []);

  const stopScreenShare = useCallback(async () => {
    if (amIScreenSharing) {
      regionRef.current = null;
      await toggleScreenShare?.(); // Stop screen sharing
    }
  }, [amIScreenSharing, toggleScreenShare]);

  // Start screen sharing when the component is mounted and not already screen sharing
  useEffect(() => {
    // eslint-disable-next-line complexity
    (async () => {
      if (!amIScreenSharing && regionRef.current && (pdfConfig.file || pdfConfig.url) && !inProgress.current) {
        regionRef.current.src = `${pdfIframeURL}${pdfConfig.url ? `?file=${pdfConfig.url}` : ''}`;
        regionRef.current.onload = () => {
          requestAnimationFrame(() => {
            sendDataToPDFIframe(pdfConfig.file);
          });
        };
        inProgress.current = true;
        await toggleScreenShare?.({
          forceCurrentTab: isChrome,
          cropElement: regionRef.current,
          preferCurrentTab: isChrome,
        });
        inProgress.current = false;
      }
    })();
  }, [amIScreenSharing, isChrome, toggleScreenShare, pdfConfig, sendDataToPDFIframe]);

  useEffect(() => {
    return () => {
      // close screenshare when this component is being unmounted
      if (amIScreenSharing) {
        resetValue();
        stopScreenShare(); // stop
      }
    };
  }, [amIScreenSharing, resetValue, stopScreenShare]);

  return {
    amIScreenSharing,
    stopScreenShare,
    regionRef,
  };
};

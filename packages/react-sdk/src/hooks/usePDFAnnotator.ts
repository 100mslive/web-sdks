import { useCallback, useEffect, useRef } from 'react';
import { selectAppData } from '@100mslive/hms-video-store';
import { useScreenShare } from './useScreenShare';
import { useHMSActions, useHMSStore } from '../primitives/HmsRoomProvider';
import { isChromiumBased, isValidPDFUrl, pdfIframeURL } from '../utils/commons';

export interface PDFConfig {
  file?: File;
  url?: string;
}
export interface usePDFAnnotatorResult {
  /**
   * pdf Config data
   */
  config: PDFConfig;

  /**
   * set pdf config data
   */
  setConfig: (value: PDFConfig) => void;

  /**
   * reset the pdf config data
   */
  resetConfig: () => void;
  /**
   * true if the local user is sharing screen, false otherwise
   */
  amIScreenSharing: boolean;

  /**
   * reference for region to be removed
   */
  regionRef: React.RefObject<HTMLIFrameElement | null>;
}

export const usePDFAnnotator = (): usePDFAnnotatorResult => {
  const actions = useHMSActions();
  const pdfConfig = useHMSStore(selectAppData('pdfConfig'));
  const setPDFConfig = useCallback(
    async (value: PDFConfig) => {
      if (value.file) {
        actions.setAppData('pdfConfig', value);
        return;
      }
      if (value.url) {
        await isValidPDFUrl(value.url);
        actions.setAppData('pdfConfig', value);
      }
    },
    [actions],
  );

  const regionRef = useRef<HTMLIFrameElement | null>(null);
  const resetPDFConfig = useCallback(() => {
    actions.setAppData('pdfConfig', {});
    regionRef.current = null;
  }, [actions]);
  const inProgress = useRef(false);
  const { amIScreenSharing, toggleScreenShare } = useScreenShare(resetPDFConfig);

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

  const stopScreenShare = useCallback(async () => {
    if (amIScreenSharing) {
      await toggleScreenShare?.(); // Stop screen sharing
    }
  }, [amIScreenSharing, toggleScreenShare]);

  // Start screen sharing when the component is mounted and not already screen sharing
  useEffect(() => {
    // eslint-disable-next-line complexity
    (async () => {
      if (!amIScreenSharing && regionRef.current && (pdfConfig?.file || pdfConfig?.url) && !inProgress.current) {
        regionRef.current.src = `${pdfIframeURL}${pdfConfig.url ? `?file=${pdfConfig.url}` : ''}`;
        regionRef.current.onload = () => {
          requestAnimationFrame(() => {
            sendDataToPDFIframe(pdfConfig.file);
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
    })();
  }, [amIScreenSharing, toggleScreenShare, pdfConfig, sendDataToPDFIframe]);

  useEffect(() => {
    return () => {
      // close screenshare when this component is being unmounted
      if (amIScreenSharing) {
        resetPDFConfig();
        stopScreenShare(); // stop
      }
    };
  }, [amIScreenSharing, resetPDFConfig, stopScreenShare]);

  return {
    config: pdfConfig,
    setConfig: setPDFConfig,
    resetConfig: resetPDFConfig,
    regionRef,
    amIScreenSharing,
  };
};

import { useCallback, useEffect, useRef } from 'react';
import { parsedUserAgent } from '@100mslive/hms-video-store';
// eslint-disable-next-line import/no-cycle
import { EmbedType, useEmbedConfig } from './useEmbedConfig';
import { useScreenShare } from './useScreenShare';
import { chromiumBasedBrowsers } from '../utils/commons';

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
  const regionRef = useRef<HTMLIFrameElement | null>(null);
  const inProgress = useRef(false);
  const isChrome = chromiumBasedBrowsers.some(
    (value: string) => parsedUserAgent.getBrowser()?.name?.toLowerCase() === value,
  );
  const { embedConfig, resetEmbedConfig } = useEmbedConfig();
  const { amIScreenSharing, toggleScreenShare } = useScreenShare(resetEmbedConfig);

  const sendDataToPDFIframe = useCallback((file?: File) => {
    if (regionRef.current && embedConfig.config.type === EmbedType.PDF) {
      regionRef.current.contentWindow?.postMessage(
        {
          theme: document.documentElement.classList.contains('dark-theme') ? 2 : 1,
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

  useEffect(() => {
    const mutationCallback = (mutations: MutationRecord[]) => {
      mutations.forEach(() => {
        if (regionRef.current) {
          regionRef.current.contentWindow?.postMessage(
            {
              theme: document.documentElement.classList.contains('dark-theme') ? 2 : 1,
            },
            '*',
          );
        }
      });
    };
    const observer = new MutationObserver(mutationCallback);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => {
      observer.disconnect();
    };
  }, []);

  // Start screen sharing when the component is mounted and not already screen sharing
  useEffect(() => {
    // eslint-disable-next-line complexity
    (async () => {
      if (!amIScreenSharing && regionRef.current && embedConfig?.config?.data && !inProgress.current) {
        if (embedConfig.config.type === EmbedType.PDF) {
          regionRef.current.src = `${pdfIframeURL}${
            typeof embedConfig.config.data === 'string' ? `?file=${embedConfig.config.data}` : ''
          }`;
        } else {
          regionRef.current.src = embedConfig.config.data;
        }
        regionRef.current.onload = () => {
          requestAnimationFrame(() => {
            sendDataToPDFIframe(embedConfig.config.data instanceof File ? embedConfig.config.data : undefined);
          });
        };
        inProgress.current = true;
        if (embedConfig.config?.type === EmbedType.PDF || embedConfig.isSharing) {
          await toggleScreenShare?.({
            forceCurrentTab: isChrome,
            cropElement: regionRef.current,
            preferCurrentTab: isChrome,
          });
        }
        inProgress.current = false;
      }
    })();
  }, [amIScreenSharing, isChrome, toggleScreenShare, embedConfig, sendDataToPDFIframe]);

  useEffect(() => {
    return () => {
      // close screenshare when this component is being unmounted
      if (amIScreenSharing) {
        resetEmbedConfig();
        stopScreenShare(); // stop
        regionRef.current = null;
      }
    };
  }, [amIScreenSharing, resetEmbedConfig, stopScreenShare]);

  return {
    amIScreenSharing,
    stopScreenShare,
    regionRef,
  };
};

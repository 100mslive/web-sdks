import { useCallback, useEffect, useRef } from 'react';
import { selectAppData } from '@100mslive/hms-video-store';
import { useScreenShare } from './useScreenShare';
import { useHMSActions, useHMSStore } from '../primitives/HmsRoomProvider';
import { isChromiumBased, isValidPDFUrl, pdfIframeURL } from '../utils/commons';

export enum EmbedType {
  PDF = 'pdf',
  EMBED = 'embed',
}
export interface PDFData {
  type: EmbedType.PDF;
  data: File | string;
}

export interface EmbedData {
  type: EmbedType.EMBED;
  data: string;
}
export interface EmbedConfig {
  config: PDFData | EmbedData;
  isSharing?: boolean;
}
export interface useEmbedScreenShareResult {
  /**
   * embed Config data
   */
  embedConfig: EmbedConfig;

  /**
   * set pdf config data
   */
  setEmbedConfig: (value: EmbedConfig) => void;

  /**
   * reset the Embed config data
   */
  resetEmbedConfig: () => void;
  /**
   * true if the local user is sharing screen, false otherwise
   */
  amIScreenSharing: boolean;

  /**
   * reference for region to be removed
   */
  regionRef: React.RefObject<HTMLIFrameElement | null>;

  /**
   * stop screen share
   */
  stopScreenShare: () => Promise<void>;
}

export const useEmbedScreenShare = (): useEmbedScreenShareResult => {
  const actions = useHMSActions();
  const embedConfig = useHMSStore(selectAppData('embedConfig'));
  const setEmbedConfig = useCallback(
    async (value: EmbedConfig) => {
      // priority file first then url
      if (value.config.type === EmbedType.EMBED) {
        actions.setAppData('embedConfig', value);
        return;
      }
      if (typeof value.config.data === 'string') {
        await isValidPDFUrl(value.config.data);
      }
      actions.setAppData('embedConfig', value);
    },
    [actions],
  );

  const regionRef = useRef<HTMLIFrameElement | null>(null);
  const resetEmbedConfig = useCallback(() => {
    actions.setAppData('embedConfig', {});
    regionRef.current = null;
  }, [actions]);
  const inProgress = useRef(false);
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
        sendDataToPDFIframe();
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
            forceCurrentTab: isChromiumBased,
            cropElement: regionRef.current,
            preferCurrentTab: isChromiumBased,
          });
        }
        inProgress.current = false;
      }
    })();
  }, [amIScreenSharing, toggleScreenShare, embedConfig, sendDataToPDFIframe]);

  useEffect(() => {
    return () => {
      // close screenshare when this component is being unmounted
      if (amIScreenSharing) {
        resetEmbedConfig();
        stopScreenShare(); // stop
      }
    };
  }, [amIScreenSharing, resetEmbedConfig, stopScreenShare]);

  return {
    embedConfig,
    setEmbedConfig,
    resetEmbedConfig,
    regionRef,
    amIScreenSharing,
    stopScreenShare,
  };
};

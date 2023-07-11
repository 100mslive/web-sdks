import { useCallback, useEffect, useRef } from 'react';
import { selectAppData } from '@100mslive/hms-video-store';
import { useScreenShare } from './useScreenShare';
import { useHMSActions, useHMSStore } from '../primitives/HmsRoomProvider';
import { isChromiumBased } from '../utils/commons';

export interface EmbedConfig {
  url: string;
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
   * start screen share
   */
  startScreenShare: () => Promise<void>;

  /**
   * stop screen share
   */
  stopScreenShare: () => Promise<void>;
}

export const useEmbedScreenShare = (): useEmbedScreenShareResult => {
  const actions = useHMSActions();
  const embedConfig = useHMSStore(selectAppData('embedConfig'));
  const setEmbedConfig = useCallback(
    (value: EmbedConfig) => {
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

  const startScreenShare = useCallback(async () => {
    if (regionRef.current) {
      await toggleScreenShare?.({
        forceCurrentTab: isChromiumBased,
        cropElement: regionRef.current,
        preferCurrentTab: isChromiumBased,
      });
    }
  }, [toggleScreenShare]);

  const stopScreenShare = useCallback(async () => {
    if (amIScreenSharing) {
      await toggleScreenShare?.(); // Stop screen sharing
    }
  }, [amIScreenSharing, toggleScreenShare]);

  // Start screen sharing when the component is mounted and not already screen sharing
  useEffect(() => {
    (async () => {
      if (!amIScreenSharing && regionRef.current && embedConfig?.url && !inProgress.current) {
        regionRef.current.src = embedConfig.url;
        inProgress.current = true;
        if (embedConfig.isSharing) {
          await startScreenShare();
        }
        inProgress.current = false;
      }
    })();
  }, [amIScreenSharing, toggleScreenShare, embedConfig, startScreenShare]);

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
    startScreenShare,
    stopScreenShare,
  };
};

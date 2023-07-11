import { useCallback, useEffect, useRef } from 'react';
import { selectAppData } from '@100mslive/hms-video-store';
import { useScreenShare } from './useScreenShare';
import { useHMSActions, useHMSStore } from '../primitives/HmsRoomProvider';
import { isChromiumBased } from '../utils/commons';

export interface EmbedConfig {
  url: string;
}
export interface useEmbedScreenShareResult {
  /**
   * embed Config data
   */
  config: EmbedConfig;

  /**
   * set pdf config data
   */
  setConfig: (value: EmbedConfig) => void;

  /**
   * reset the Embed config data
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
        await startScreenShare();
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
    config: embedConfig,
    setConfig: setEmbedConfig,
    resetConfig: resetEmbedConfig,
    regionRef,
    amIScreenSharing,
  };
};

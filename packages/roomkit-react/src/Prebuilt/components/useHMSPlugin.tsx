import { useCallback, useEffect, useState } from 'react';
// eslint-disable-next-line no-restricted-imports -- False positive since it's a type import
import type { HMSEffectsPlugin } from '@100mslive/hms-virtual-background';
import {
  selectEffectsKey,
  selectIsLocalVideoPluginPresent,
  selectLocalPeerRoleName,
  selectLocalVideoTrackID,
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';

const BLUR_POWER = 0.3;
export const useHMSVirtualBackground = () => {
  const [VBPlugin, setVBPlugin] = useState<HMSEffectsPlugin | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const effectsKey = useHMSStore(selectEffectsKey);
  const hmsActions = useHMSActions();
  const pluginName = VBPlugin?.getName() || '';
  const isEnabled = useHMSStore(selectIsLocalVideoPluginPresent(pluginName));
  const localPeerVideoTrackID = useHMSStore(selectLocalVideoTrackID);
  const localPeerRoleName = useHMSStore(selectLocalPeerRoleName);

  console.log('>>>>>>> Render', {
    isEnabled,
    localPeerVideoTrackID,
    localPeerRoleName,
    VBPlugin,
  });

  useEffect(() => {
    if (localPeerRoleName === 'broadcaster' && localPeerVideoTrackID) {
      console.log('>>>>>> enabling video');
      hmsActions.setLocalVideoEnabled(true);
    }
  }, [localPeerRoleName, hmsActions, localPeerVideoTrackID]);

  // initialize Virtual Background Plugin when effectsKey is available
  useEffect(() => {
    async function initializePlugin() {
      if (!VBPlugin && effectsKey) {
        const module = await import(/* webpackChunkName: "VirtualBackground" */ '@100mslive/hms-virtual-background');
        console.log('>>>>>>> setVBPlugin');
        setVBPlugin(new module.HMSEffectsPlugin(effectsKey));
      }
    }
    void initializePlugin();
  }, [effectsKey, VBPlugin]);

  // Add Virtual Background Plugin to local video track once it's available
  useEffect(() => {
    async function enablePlugin() {
      if (localPeerVideoTrackID && !isEnabled && VBPlugin) {
        try {
          console.log('>>>>>>> addPluginsToVideoStream');
          await hmsActions.addPluginsToVideoStream([VBPlugin]);
        } catch (e: any) {
          setErrorMessage(e.message);
        }
      }
    }

    void enablePlugin();
  }, [localPeerVideoTrackID, hmsActions, isEnabled, VBPlugin]);

  const addBlur = useCallback(() => {
    console.log('>>>>>>> addBlur', { isEnabled, VBPlugin });
    isEnabled && VBPlugin?.setBlur(BLUR_POWER);
  }, [VBPlugin, isEnabled]);

  const removeBlur = useCallback(() => {
    isEnabled && VBPlugin?.removeBlur();
  }, [VBPlugin, isEnabled]);

  return {
    addBlur,
    removeBlur,
    isEnabled,
    errorMessage,
  };
};

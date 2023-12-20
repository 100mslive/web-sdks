import { useRef } from 'react';
import { HMSEffectsPlugin, HMSVBPlugin, HMSVirtualBackgroundTypes } from '@100mslive/hms-virtual-background';

const HMSVBPluginObject = new HMSVBPlugin(HMSVirtualBackgroundTypes.NONE, HMSVirtualBackgroundTypes.NONE);
const EffectsVBPluginObject = new HMSEffectsPlugin();

export const useVBMethods = () => {
  const useEffectsVB = true;
  const EffectsVBPluginRef = useRef(useEffectsVB ? EffectsVBPluginObject : null);
  const HMSVBPluginRef = useRef(HMSVBPluginObject);

  return {
    // @ts-ignore
    background: useEffectsVB
      ? EffectsVBPluginRef.current.getBackground()
      : HMSVBPluginRef.current.background?.src || HMSVBPluginRef.current.background,
    setBlur: async (blurPower: number) => {
      if (useEffectsVB) {
        EffectsVBPluginRef.current?.setBlur(blurPower);
      } else {
        await HMSVBPluginRef.current.setBackground(HMSVirtualBackgroundTypes.BLUR, HMSVirtualBackgroundTypes.BLUR);
      }
    },
    setBackground: async (mediaURL: string) => {
      if (useEffectsVB) {
        EffectsVBPluginRef.current?.setBackground(mediaURL);
      } else {
        const img = document.createElement('img');
        let retries = 0;
        const MAX_RETRIES = 3;
        img.alt = 'VB';
        img.src = mediaURL;
        try {
          await HMSVBPluginRef.current.setBackground(img, HMSVirtualBackgroundTypes.IMAGE);
        } catch (e) {
          console.error(e);
          if (retries++ < MAX_RETRIES) {
            await HMSVBPluginRef.current.setBackground(img, HMSVirtualBackgroundTypes.IMAGE);
          }
        }
      }
    },
    removeEffects: async () => {
      if (useEffectsVB) {
        EffectsVBPluginRef.current?.removeEffects();
      } else {
        await HMSVBPluginRef.current.setBackground(HMSVirtualBackgroundTypes.NONE, HMSVirtualBackgroundTypes.NONE);
      }
    },
    vbObject: useEffectsVB && EffectsVBPluginRef.current ? EffectsVBPluginRef.current : HMSVBPluginRef.current,
    isVideoStreamPlugin: useEffectsVB,
  };
};

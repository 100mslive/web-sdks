import { HMSEffectsPlugin, HMSVBPlugin, HMSVirtualBackgroundTypes } from '@100mslive/hms-virtual-background';

export class VBPlugin {
  private hmsPlugin?: HMSVBPlugin;
  private effectsPlugin?: HMSEffectsPlugin;

  constructor(private useEffectsVB = false) {
    if (useEffectsVB) {
      this.effectsPlugin = new HMSEffectsPlugin(process.env.REACT_APP_EFFECTS_SDK_KEY || '');
    } else {
      this.hmsPlugin = new HMSVBPlugin(HMSVirtualBackgroundTypes.NONE, HMSVirtualBackgroundTypes.NONE);
    }
  }

  getBackground = () => {
    if (this.useEffectsVB) {
      return this.effectsPlugin?.getBackground();
    } else {
      // @ts-ignore
      return this.hmsPlugin?.background?.src || this.hmsPlugin?.background;
    }
  };

  getVBObject = () => {
    return this.useEffectsVB ? this.effectsPlugin : this.hmsPlugin;
  };

  getName = () => {
    return this.useEffectsVB ? this.effectsPlugin?.getName() : this.hmsPlugin?.getName();
  };

  setBlur = async (blurPower: number) => {
    if (this.useEffectsVB) {
      this.effectsPlugin?.setBlur(blurPower);
    } else {
      await this.hmsPlugin?.setBackground(HMSVirtualBackgroundTypes.BLUR, HMSVirtualBackgroundTypes.BLUR);
    }
  };
  setBackground = async (mediaURL: string) => {
    if (this.useEffectsVB) {
      this.effectsPlugin?.setBackground(mediaURL);
    } else {
      const img = document.createElement('img');
      let retries = 0;
      const MAX_RETRIES = 3;
      img.alt = 'VB';
      img.src = mediaURL;
      try {
        await this.hmsPlugin?.setBackground(img, HMSVirtualBackgroundTypes.IMAGE);
      } catch (e) {
        console.error(e);
        if (retries++ < MAX_RETRIES) {
          await this.hmsPlugin?.setBackground(img, HMSVirtualBackgroundTypes.IMAGE);
        }
      }
    }
  };
  removeEffects = async () => {
    if (this.useEffectsVB) {
      this.effectsPlugin?.removeEffects();
    } else {
      await this.hmsPlugin?.setBackground(HMSVirtualBackgroundTypes.NONE, HMSVirtualBackgroundTypes.NONE);
    }
  };
}

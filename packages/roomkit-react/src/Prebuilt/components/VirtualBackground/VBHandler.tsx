import { HMSEffectsPlugin, HMSVBPlugin, HMSVirtualBackgroundTypes } from '@100mslive/hms-virtual-background';

export class VBPlugin {
  private hmsPlugin?: HMSVBPlugin;
  private effectsPlugin?: HMSEffectsPlugin | undefined;

  initialisePlugin = (effectsSDKKey?: string) => {
    if (this.getVBObject()) {
      return;
    }
    if (effectsSDKKey) {
      this.effectsPlugin = new HMSEffectsPlugin(effectsSDKKey);
    } else {
      this.hmsPlugin = new HMSVBPlugin(HMSVirtualBackgroundTypes.NONE, HMSVirtualBackgroundTypes.NONE);
    }
  };

  getBackground = () => {
    if (this.effectsPlugin) {
      return this.effectsPlugin?.getBackground();
    } else {
      const background = this.hmsPlugin?.getBackground();
      // @ts-ignore
      return background?.src || background;
    }
  };

  getBlurAmount = () => {
    if (this.effectsPlugin) {
      return this.effectsPlugin.getBlurAmount();
    } else {
      // Treating HMS VB intensity as a fixed value
      return this.hmsPlugin?.getBackground() === HMSVirtualBackgroundTypes.BLUR ? 1 : 0;
    }
  };

  getVBObject = () => {
    return this.effectsPlugin || this.hmsPlugin;
  };

  getName = () => {
    return this.effectsPlugin ? this.effectsPlugin?.getName() : this.hmsPlugin?.getName();
  };

  setBlur = async (blurPower: number) => {
    if (this.effectsPlugin) {
      this.effectsPlugin?.setBlur(blurPower);
    } else {
      await this.hmsPlugin?.setBackground(HMSVirtualBackgroundTypes.BLUR, HMSVirtualBackgroundTypes.BLUR);
    }
  };

  setBackground = async (mediaURL: string) => {
    if (this.effectsPlugin) {
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

  setPreset = async (preset: string) => {
    if (this.effectsPlugin) {
      await this.effectsPlugin.setPreset(preset);
    }
  };

  getPreset = () => {
    return this.effectsPlugin?.getPreset() || '';
  };

  removeEffects = async () => {
    if (this.effectsPlugin) {
      this.effectsPlugin?.removeEffects();
    } else {
      await this.hmsPlugin?.setBackground(HMSVirtualBackgroundTypes.NONE, HMSVirtualBackgroundTypes.NONE);
    }
  };

  reset = () => {
    this.effectsPlugin = undefined;
    this.hmsPlugin = undefined;
  };
}

export const VBHandler = new VBPlugin();

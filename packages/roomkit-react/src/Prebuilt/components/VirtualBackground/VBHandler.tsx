import { HMSVBPlugin, HMSVirtualBackgroundTypes } from '@100mslive/hms-virtual-background';

export class VBPlugin {
  private hmsPlugin?: HMSVBPlugin;
  // eslint-disable-next-line
  private effectsPlugin?: any;

  initialisePlugin = async (effectsSDKKey?: string, onInit?: () => void) => {
    if (this.getVBObject()) {
      return;
    }
    if (effectsSDKKey) {
      try {
        const { HMSEffectsPlugin } = await import('@100mslive/hms-virtual-background');
        this.effectsPlugin = new HMSEffectsPlugin(effectsSDKKey, onInit);
      } catch (error) {
        setTimeout(() => onInit?.(), 2000);
        this.hmsPlugin = new HMSVBPlugin(HMSVirtualBackgroundTypes.NONE, HMSVirtualBackgroundTypes.NONE);
      }
    } else {
      this.hmsPlugin = new HMSVBPlugin(HMSVirtualBackgroundTypes.NONE, HMSVirtualBackgroundTypes.NONE);
    }
  };

  private isEffectsPlugin(): boolean {
    return this.effectsPlugin !== undefined;
  }

  getBackground = () => {
    if (this.isEffectsPlugin()) {
      return this.effectsPlugin.getBackground();
    } else {
      const background = this.hmsPlugin?.getBackground();
      return background?.src || background;
    }
  };

  getBlurAmount = () => {
    if (this.isEffectsPlugin()) {
      return this.effectsPlugin.getBlurAmount();
    }
    return this.hmsPlugin?.getBackground() === HMSVirtualBackgroundTypes.BLUR ? 1 : 0;
  };

  getVBObject = () => {
    return this.effectsPlugin || this.hmsPlugin;
  };

  getName = () => {
    return this.isEffectsPlugin() ? this.effectsPlugin.getName() : this.hmsPlugin?.getName();
  };

  setBlur = async (blurPower: number) => {
    if (this.isEffectsPlugin()) {
      this.effectsPlugin.setBlur(blurPower);
    } else {
      await this.hmsPlugin?.setBackground(HMSVirtualBackgroundTypes.BLUR, HMSVirtualBackgroundTypes.BLUR);
    }
  };

  setBackground = async (mediaURL: string) => {
    if (this.isEffectsPlugin()) {
      this.effectsPlugin.setBackground(mediaURL);
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

  setPreset = async (preset: 'quality' | 'balanced') => {
    if (this.isEffectsPlugin()) {
      await this.effectsPlugin.setPreset(preset);
    }
  };

  getPreset = () => {
    return this.isEffectsPlugin() ? this.effectsPlugin.getPreset() : '';
  };

  removeEffects = async () => {
    if (this.isEffectsPlugin()) {
      this.effectsPlugin.removeEffects();
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

// Open issue with eslint-plugin-import https://github.com/import-js/eslint-plugin-import/issues/1810
// eslint-disable-next-line
import { HMSVBPlugin, HMSVirtualBackgroundTypes } from '@100mslive/hms-virtual-background/hmsvbplugin';
import { parsedUserAgent } from '@100mslive/react-sdk';
import { isIOS, isSafari } from '../../common/constants';
export class VBPlugin {
  private hmsPlugin?: HMSVBPlugin;
  private effectsPlugin?: any;

  initialisePlugin = async (effectsSDKKey?: string, onInit?: () => void) => {
    if (this.getVBObject()) {
      return;
    }
    if (effectsSDKKey) {
      try {
        // eslint-disable-next-line
        const effects = await import('@100mslive/hms-virtual-background/hmseffectsplugin');
        this.effectsPlugin = new effects.HMSEffectsPlugin(effectsSDKKey, onInit);
      } catch (error) {
        console.error('Failed to initialise HMSEffectsPlugin:', error, 'Using HMSVBPlugin');
        this.hmsPlugin = new HMSVBPlugin(HMSVirtualBackgroundTypes.NONE, HMSVirtualBackgroundTypes.NONE);
      }
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

  setPreset = async (preset: 'quality' | 'balanced') => {
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

  isBlurSupported = () => {
    if ((isSafari || isIOS) && this.hmsPlugin) {
      return false;
    }

    if (this.effectsPlugin) {
      return true;
    }

    return false;
  };

  isEffectsSupported = () => {
    if (!isSafari) {
      return true;
    }
    const browserVersion = parsedUserAgent?.getBrowser()?.version || '16';
    if (browserVersion && parseInt(browserVersion.split('.')[0]) < 17) {
      return false;
    }
    return true;
  };
}

export const VBHandler = new VBPlugin();

import { HMSVBPlugin, HMSVirtualBackgroundTypes } from '@100mslive/hms-virtual-background';
export class VBPlugin {
  private hmsPlugin?: HMSVBPlugin;

  initialisePlugin = (effectsSDKKey?: string, onInit?: () => void) => {
    console.log({ effectsSDKKey, onInit });
    if (this.getVBObject()) {
      return;
    }
    this.hmsPlugin = new HMSVBPlugin(HMSVirtualBackgroundTypes.NONE, HMSVirtualBackgroundTypes.NONE);
  };

  getBackground = () => {
    const background = this.hmsPlugin?.getBackground();
    // @ts-ignore
    return background?.src || background;
  };

  getBlurAmount = () => {
    // Treating HMS VB intensity as a fixed value
    return this.hmsPlugin?.getBackground() === HMSVirtualBackgroundTypes.BLUR ? 1 : 0;
  };

  getVBObject = () => {
    return this.hmsPlugin;
  };

  getName = () => {
    return this.hmsPlugin?.getName();
  };

  setBlur = async (blurPower: number) => {
    console.log({ blurPower });
    await this.hmsPlugin?.setBackground(HMSVirtualBackgroundTypes.BLUR, HMSVirtualBackgroundTypes.BLUR);
  };

  setBackground = async (mediaURL: string) => {
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
  };

  setPreset = async (preset: 'quality' | 'balanced') => {
    console.log({ preset });
  };

  getPreset = () => {
    return '';
  };

  removeEffects = async () => {
    await this.hmsPlugin?.setBackground(HMSVirtualBackgroundTypes.NONE, HMSVirtualBackgroundTypes.NONE);
  };

  reset = () => {
    this.hmsPlugin = undefined;
  };
}

export const VBHandler = new VBPlugin();

import { tsvb } from 'effects-sdk';
import { HMSMediaStreamPlugin } from '@100mslive/hms-video-store';
import { EFFECTS_SDK_ASSETS } from './constants';
import { HMSVirtualBackgroundTypes } from './interfaces';

export type HMSEffectsBackground = string | MediaStream | MediaStreamTrack | HTMLVideoElement;

export class HMSEffectsPlugin implements HMSMediaStreamPlugin {
  private effects: tsvb;
  // Ranges from 0 to 1
  private blurAmount = 0;
  private background: HMSEffectsBackground = HMSVirtualBackgroundTypes.NONE;
  private backgroundType = HMSVirtualBackgroundTypes.NONE;
  private preset = 'balanced';

  constructor(effectsSDKKey: string) {
    this.effects = new tsvb(effectsSDKKey);
    this.effects.config({
      sdk_url: EFFECTS_SDK_ASSETS,
      models: {
        colorcorrector: '',
        facedetector: '',
        lowlighter: '',
      },
      wasmPaths: {
        'ort-wasm.wasm': `${EFFECTS_SDK_ASSETS}ort-wasm.wasm`,
        'ort-wasm-simd.wasm': `${EFFECTS_SDK_ASSETS}ort-wasm-simd.wasm`,
        'ort-wasm-threaded.wasm': `${EFFECTS_SDK_ASSETS}ort-wasm-threaded.wasm`,
        'ort-wasm-simd-threaded.wasm': `${EFFECTS_SDK_ASSETS}ort-wasm-simd-threaded.wasm`,
      },
    });
  }

  getName(): string {
    return 'HMSEffects';
  }

  removeBlur() {
    this.blurAmount = 0;
    this.effects.clearBlur();
  }

  removeBackground() {
    this.background = '';
    this.effects.clearBackground();
  }

  setBlur(blur: number) {
    this.removeBackground();
    this.blurAmount = blur;
    this.backgroundType = HMSVirtualBackgroundTypes.BLUR;
    this.effects.setBlur(blur);
  }

  async setPreset(preset: string) {
    this.preset = preset;
    await this.effects.setSegmentationPreset(this.preset);
  }

  getPreset() {
    return this.preset;
  }

  removeEffects() {
    this.backgroundType = HMSVirtualBackgroundTypes.NONE;
    this.removeBackground();
    this.removeBlur();
  }

  setBackground(url: HMSEffectsBackground) {
    this.background = url;
    this.removeBlur();
    this.backgroundType = HMSVirtualBackgroundTypes.IMAGE;
    this.effects.setBackground(url);
  }

  getBlurAmount() {
    return this.blurAmount;
  }

  getBackground() {
    return this.background || this.backgroundType;
  }

  apply(stream: MediaStream): MediaStream {
    this.effects.onReady = () => {
      if (this.effects) {
        this.effects.run();
        this.effects.setBackgroundFitMode('fill');
        this.effects.setSegmentationPreset(this.preset);
        if (this.blurAmount) {
          this.setBlur(this.blurAmount);
        } else if (this.background) {
          this.setBackground(this.background);
        }
      }
    };
    this.effects.clear();
    this.effects.useStream(stream);
    // getStream potentially returns null
    return this.effects.getStream() || stream;
  }

  stop() {
    this.removeEffects();
    this.effects.stop();
  }
}

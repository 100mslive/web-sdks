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
  private preset: 'balanced' | 'quality' = 'balanced';
  private initialised = false;
  private intervalId: NodeJS.Timer | null = null;
  private onInit;
  private canvas: HTMLCanvasElement;

  constructor(effectsSDKKey: string, onInit?: () => void) {
    this.effects = new tsvb(effectsSDKKey);
    this.onInit = onInit;
    this.canvas = document.createElement('canvas');
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
      },
      provider: 'webgpu',
    });
    this.effects.onError(err => {
      // currently logging info type messages as well
      if (!err.type || err.type === 'error') {
        console.error('[HMSEffectsPlugin]', err);
      }
    });
  }

  getName(): string {
    return 'HMSEffects';
  }

  private executeAfterInit(callback: () => void) {
    if (this.initialised) {
      callback();
    }

    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
    }
    this.intervalId = setInterval(() => {
      if (this.initialised) {
        clearInterval(this.intervalId!);
        callback();
      }
    }, 100);
  }

  removeBlur() {
    this.blurAmount = 0;
    this.executeAfterInit(() => {
      this.effects.clearBlur();
    });
  }

  removeBackground() {
    this.background = '';
    this.executeAfterInit(() => {
      this.effects.clearBackground();
    });
  }

  /**
   * @param blur ranges between 0 and 1
   */
  setBlur(blur: number) {
    this.blurAmount = blur;
    this.backgroundType = HMSVirtualBackgroundTypes.BLUR;
    this.removeBackground();
    this.executeAfterInit(() => {
      this.effects.setBlur(this.blurAmount);
    });
  }

  /**
   * @param preset can be 'quality' or 'balanced'. The 'quality' preset has better quality but higher CPU usage than 'balanced'
   */
  async setPreset(preset: 'quality' | 'balanced') {
    this.preset = preset;
    this.executeAfterInit(async () => {
      await this.effects.setSegmentationPreset(this.preset);
    });
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
    this.backgroundType = HMSVirtualBackgroundTypes.IMAGE;
    this.removeBlur();
    this.executeAfterInit(() => {
      this.effects.setBackground(this.background);
    });
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
        this.initialised = true;
        this.onInit?.();
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
    const { height, width } = stream.getVideoTracks()[0].getSettings();
    this.canvas.width = width!;
    this.canvas.height = height!;
    this.effects.useStream(stream);
    this.effects.toCanvas(this.canvas);
    return this.canvas.captureStream(30) || stream;
  }

  stop() {
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.removeEffects();
    this.executeAfterInit(() => {
      this.effects.stop();
    });
  }
}

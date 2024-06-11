import { tsvb } from 'effects-sdk';
import { HMSMediaStreamPlugin, parsedUserAgent } from '@100mslive/hms-video-store';
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
  private onResolutionChangeCallback?: (width: number, height: number) => void;
  private canvas: HTMLCanvasElement;

  constructor(effectsSDKKey: string, onInit?: () => void) {
    this.effects = new tsvb(effectsSDKKey);
    this.onInit = onInit;
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
    });
    this.effects.cache();
    // mweb optimisation
    if (parsedUserAgent.getDevice().type === 'mobile') {
      this.effects.enableFrameSkipping();
    }
    this.effects.setBackgroundFitMode('fill');
    this.effects.setSegmentationPreset(this.preset);

    this.effects.onReady = () => {
      if (this.effects) {
        this.initialised = true;
        this.onInit?.();
        this.effects.run();
      }
    };
    this.canvas = document.createElement('canvas');
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

  onResolutionChange(callback: (width: number, height: number) => void) {
    this.onResolutionChangeCallback = callback;
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

  private updateCanvas(stream: MediaStream) {
    const { height, width } = stream.getVideoTracks()[0].getSettings();
    this.canvas.width = width!;
    this.canvas.height = height!;
    this.effects.useStream(stream);
    this.effects.toCanvas(this.canvas);
  }

  apply(stream: MediaStream): MediaStream {
    if (this.blurAmount) {
      this.setBlur(this.blurAmount);
    } else if (this.background) {
      this.setBackground(this.background);
    }
    this.effects.clear();
    this.effects.onChangeInputResolution(() => {
      this.updateCanvas(stream);
      const { height, width } = stream.getVideoTracks()[0].getSettings();
      this.onResolutionChangeCallback?.(width!, height!);
    });
    this.updateCanvas(stream);

    return this.canvas.captureStream(30) || stream;
  }

  stop() {
    this.removeEffects();
    this.executeAfterInit(() => {
      this.effects.stop();
    });
  }
}

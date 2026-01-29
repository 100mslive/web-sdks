import { tsvb } from 'effects-sdk';
import { HMSMediaStreamPlugin } from '@100mslive/hms-video-store';
import { EFFECTS_SDK_ASSETS } from './constants';
import { HMSVirtualBackgroundTypes } from './interfaces';

export type HMSEffectsBackground = string | MediaStream | MediaStreamTrack | HTMLVideoElement;

export class HMSEffectsPlugin implements HMSMediaStreamPlugin {
  private effects: tsvb;
  // Ranges from 0 to 1, inclusive
  private blurAmount = 0;
  private background?: HMSEffectsBackground;
  private backgroundType = HMSVirtualBackgroundTypes.NONE;
  private preset: 'balanced' | 'quality' | 'lightning' = 'balanced';
  private initPromise: Promise<void>;
  private resolveInit!: () => void;
  private onInit;
  private onResolutionChangeCallback?: (width: number, height: number) => void;
  private TAG = '[HMSEffectsPlugin]';
  // Queue to serialize effect operations and prevent race conditions
  private operationQueue: Promise<void> = Promise.resolve();
  // Counter to track the latest effect request and skip stale operations
  private effectRequestId = 0;

  constructor(effectsSDKKey: string, onInit?: () => void) {
    this.effects = new tsvb(effectsSDKKey);
    this.onInit = onInit;
    this.initPromise = new Promise(resolve => {
      this.resolveInit = resolve;
    });
    this.effects.config({
      sdk_url: EFFECTS_SDK_ASSETS,
      models: {
        colorcorrector: '',
        facedetector: '',
        lowlighter: '',
      },
      // provider: 'auto',
      test_inference: true,
      wasmPaths: {
        'ort-wasm.wasm': `${EFFECTS_SDK_ASSETS}ort-wasm.wasm`,
        'ort-wasm-simd.wasm': `${EFFECTS_SDK_ASSETS}ort-wasm-simd.wasm`,
        'ort-wasm-simd.jsep.wasm': `${EFFECTS_SDK_ASSETS}ort-wasm-simd.jsep.wasm`,
      },
    });
    this.effects.onError(err => {
      // The SDK fires various messages through onError:
      // - Info messages with type='info' (we ignore these)
      // - Error messages with type='error' and a message property
      // - Raw Event objects with no message (we ignore these as they're not actionable)
      if (err.type === 'error' && err.message) {
        console.error(this.TAG, 'Effects SDK error:', err.message);
      }
    });
    this.effects.cache();
    this.effects.onReady = () => {
      if (this.effects) {
        this.resolveInit();
        this.onInit?.();
        this.effects.showFps();
        this.effects.setBackgroundFitMode('fill');
        this.effects.setSegmentationPreset(this.preset);
      }
    };
  }

  getName(): string {
    return 'HMSEffects';
  }

  isSupported(): boolean {
    return this.effects.isSupported();
  }

  private enqueueOperation(callback: () => void): Promise<void> {
    this.operationQueue = this.operationQueue
      .then(() => this.initPromise)
      .then(() => callback())
      .catch(err => {
        console.error(this.TAG, 'Operation failed:', err);
      });
    return this.operationQueue;
  }

  removeBlur() {
    this.blurAmount = 0;
    if (this.backgroundType === HMSVirtualBackgroundTypes.BLUR) {
      this.backgroundType = HMSVirtualBackgroundTypes.NONE;
    }
    const requestId = ++this.effectRequestId;
    this.enqueueOperation(() => {
      // Skip if a newer effect request was made
      if (requestId !== this.effectRequestId) {
        return;
      }
      this.effects.clearBlur();
    });
  }

  removeBackground() {
    this.background = '';
    if (this.backgroundType === HMSVirtualBackgroundTypes.IMAGE) {
      this.backgroundType = HMSVirtualBackgroundTypes.NONE;
    }
    const requestId = ++this.effectRequestId;
    this.enqueueOperation(() => {
      // Skip if a newer effect request was made
      if (requestId !== this.effectRequestId) {
        return;
      }
      this.effects.clearBackground();
    });
  }

  /**
   * @param blur ranges between 0 and 1
   */
  setBlur(blur: number) {
    if (blur < 0 || blur > 1) {
      throw new Error('Blur amount should be between 0 and 1');
    }
    this.blurAmount = blur;
    this.background = '';
    this.backgroundType = HMSVirtualBackgroundTypes.BLUR;
    const requestId = ++this.effectRequestId;
    this.enqueueOperation(() => {
      // Skip if a newer effect request was made
      if (requestId !== this.effectRequestId) {
        return;
      }
      this.effects.clearBackground();
      this.effects.setBlur(this.blurAmount);
      this.effects.run();
    });
  }

  /**
   * @param preset can be 'quality' or 'balanced'. The 'quality' preset has better quality but higher CPU usage than 'balanced'
   */
  async setPreset(preset: 'quality' | 'balanced') {
    this.preset = preset;
    return new Promise((resolve, reject) => {
      this.enqueueOperation(() => {
        this.effects.setSegmentationPreset(this.preset).then(resolve).catch(reject);
      });
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
    this.background = '';
    this.blurAmount = 0;
    const requestId = ++this.effectRequestId;
    this.enqueueOperation(() => {
      // Skip if a newer effect request was made
      if (requestId !== this.effectRequestId) {
        return;
      }
      this.effects.clearBackground();
      this.effects.clearBlur();
      this.effects.stop();
    });
  }

  setBackground(url: HMSEffectsBackground) {
    if (!url) {
      throw new Error('Background url cannot be empty');
    }
    this.background = url;
    this.blurAmount = 0;
    this.backgroundType = HMSVirtualBackgroundTypes.IMAGE;
    const requestId = ++this.effectRequestId;
    this.enqueueOperation(() => {
      // Skip if a newer effect request was made
      if (requestId !== this.effectRequestId) {
        return;
      }
      this.effects.clearBlur();
      this.effects.setBackground(this.background);
      this.effects.run();
    });
  }

  getBlurAmount() {
    return this.blurAmount;
  }

  getBackground() {
    return this.background || this.backgroundType;
  }

  /**
   * Get performance metrics from the effects SDK
   * @returns metrics object with fps, processing time, etc.
   */
  getMetrics() {
    return this.effects.getMetrics?.();
  }

  apply(stream: MediaStream): MediaStream {
    this.effects.clear();
    this.applyEffect();
    this.effects.onChangeInputResolution(() => {
      const effectsStream = this.effects.getStream();
      if (effectsStream) {
        const { height, width } = effectsStream.getVideoTracks()[0].getSettings();
        this.onResolutionChangeCallback?.(width!, height!);
      }
    });
    this.effects.useStream(stream);
    return this.effects.getStream() || stream;
  }

  stop() {
    this.removeEffects();
  }

  private applyEffect() {
    if (this.blurAmount) {
      this.setBlur(this.blurAmount);
    } else if (this.background) {
      this.setBackground(this.background);
    }
  }
}

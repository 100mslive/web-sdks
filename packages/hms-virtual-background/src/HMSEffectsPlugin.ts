import { tsvb } from 'effects-sdk';
import { HMSMediaStreamPlugin } from '@100mslive/hms-video-store';
import { EFFECTS_SDK_ASSETS } from './constants';
import { HMSVirtualBackgroundTypes } from './interfaces';

export type HMSEffectsBackground = string | MediaStream | MediaStreamTrack | HTMLVideoElement;

export class HMSEffectsPlugin implements HMSMediaStreamPlugin {
  private effects: tsvb;
  // Ranges from 0 to 1, inclusive
  private blurAmount = 0;
  private background: HMSEffectsBackground = HMSVirtualBackgroundTypes.NONE;
  private backgroundType = HMSVirtualBackgroundTypes.NONE;
  private preset: 'balanced' | 'quality' = 'balanced';
  private initPromise: Promise<void>;
  private resolveInit!: () => void;
  private onInit;
  private onResolutionChangeCallback?: (width: number, height: number) => void;
  private canvas: HTMLCanvasElement;
  private cpuObserver: any;
  private TAG = '[HMSEffectsPlugin]';

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
      test_inference: true,
      wasmPaths: {
        'ort-wasm.wasm': `${EFFECTS_SDK_ASSETS}ort-wasm.wasm`,
        'ort-wasm-simd.wasm': `${EFFECTS_SDK_ASSETS}ort-wasm-simd.wasm`,
        'ort-wasm-simd.jsep.wasm': `${EFFECTS_SDK_ASSETS}ort-wasm-simd.jsep.wasm`,
      },
    });
    this.canvas = document.createElement('canvas');
    this.effects.onError(err => {
      // currently logging info type messages as well
      if (!err.type || err.type === 'error') {
        console.error(this.TAG, err);
      }
    });
    this.effects.cache();
    this.effects.onReady = () => {
      if (this.effects) {
        this.resolveInit();
        this.onInit?.();
        this.effects.setBackgroundFitMode('fill');
        this.effects.setSegmentationPreset(this.preset);
        this.trackCPUUsageAndAdapt();
      }
    };
  }

  getName(): string {
    return 'HMSEffects';
  }

  isSupported(): boolean {
    return this.effects.isSupported();
  }

  private async executeAfterInit(callback: () => void) {
    await this.initPromise;
    callback();
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
    if (blur < 0 || blur > 1) {
      throw new Error('Blur amount should be between 0 and 1');
    }
    this.backgroundType = HMSVirtualBackgroundTypes.BLUR;
    this.removeBackground();
    this.executeAfterInit(() => {
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
      this.executeAfterInit(() => {
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
    this.removeBackground();
    this.removeBlur();
    this.executeAfterInit(() => {
      this.effects.stop();
      this.cpuObserver?.disconnect();
    });
  }

  setBackground(url: HMSEffectsBackground) {
    if (!url) {
      throw new Error('Background url cannot be empty');
    }
    this.background = url;
    this.backgroundType = HMSVirtualBackgroundTypes.IMAGE;
    this.removeBlur();
    this.executeAfterInit(() => {
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

  private updateCanvas(stream: MediaStream) {
    const { height, width } = stream.getVideoTracks()[0].getSettings();
    this.canvas.width = width!;
    this.canvas.height = height!;
    this.effects.useStream(stream);
    this.effects.toCanvas(this.canvas);
  }

  apply(stream: MediaStream): MediaStream {
    this.effects.clear();
    this.applyEffect();
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
  }

  private applyEffect() {
    if (this.blurAmount) {
      this.setBlur(this.blurAmount);
    } else if (this.background) {
      this.setBackground(this.background);
    }
  }

  private pressureCallback = (records: any[]) => {
    const lastRecord = records[records.length - 1];
    console.debug(`Current pressure ${lastRecord.state}`);
    if (lastRecord.state === 'critical' || lastRecord.state === 'serious') {
      this.executeAfterInit(() => {
        this.effects.clearBlur();
        this.effects.clearBackground();
      });
    } else {
      // enable all video feeds and filter effects
      if (this.backgroundType === HMSVirtualBackgroundTypes.BLUR) {
        this.setBlur(this.blurAmount);
      } else if (this.backgroundType === HMSVirtualBackgroundTypes.IMAGE && this.background) {
        this.setBackground(this.background);
      }
    }
  };

  private async trackCPUUsageAndAdapt() {
    if ('PressureObserver' in window) {
      try {
        // @ts-ignore
        this.cpuObserver = new PressureObserver(this.pressureCallback);
        await this.cpuObserver?.observe('cpu', {
          sampleInterval: 1000, // 1000ms
        });
      } catch (error) {
        // report error setting up the observer
        console.error('Error setting up CPU Usage tracker:', error);
      }
    }
  }
}

import { tsvb } from 'effects-sdk';
import { HMSMediaStreamPlugin } from '@100mslive/hms-video';
import { EFFECTS_SDK_ASSETS, EFFECTS_SDK_KEY } from './constants';
import { HMSVirtualBackgroundTypes } from './interfaces';

export type HMSEffectsBackground = string | MediaStream | MediaStreamTrack | HTMLVideoElement;

export class HMSEffectsPlugin implements HMSMediaStreamPlugin {
  private effects: tsvb;
  // Ranges from 0 to 1
  private blurAmount = 0;
  private background: HMSEffectsBackground = '';
  private beautify = false;
  private backgroundType = HMSVirtualBackgroundTypes.NONE;
  // private preset: 'balanced' | 'speed' | 'lightning' | 'quality' = 'balanced';

  constructor() {
    this.effects = new tsvb(EFFECTS_SDK_KEY);
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

  setBlur(blur: number) {
    // this.preset = 'speed';
    this.blurAmount = blur;
    this.background = '';
    this.backgroundType = HMSVirtualBackgroundTypes.BLUR;
    this.effects.clearBackground();
    this.effects.setBlur(blur);
  }

  removeEffects() {
    this.effects.clearBackground();
    this.effects.clearBlur();
    this.backgroundType = HMSVirtualBackgroundTypes.NONE;
    this.background = '';
  }

  setBackground(url: HMSEffectsBackground) {
    // this.preset = 'balanced';
    this.background = url;
    this.blurAmount = 0;
    this.backgroundType = HMSVirtualBackgroundTypes.IMAGE;
    this.effects.clearBlur();
    this.effects.setBackground(url);
  }

  getBackground() {
    return this.background || this.backgroundType;
  }

  apply(stream: MediaStream): MediaStream {
    this.effects.onReady = () => {
      if (this.effects) {
        this.effects.showFps();
        this.effects.run();
        // available preset mode = 'quality | balanced | speed | lightning'
        // this.effects.setSegmentationPreset(this.preset);
        // available fit mode = 'fill | fit'
        this.effects.setBackgroundFitMode('fill');
        this.effects.setSegmentationPreset('lightning');
        // Also ranges from 0 to 1
        // this.effects.setBeautificationLevel(0.5);
        if (this.blurAmount) {
          this.setBlur(this.blurAmount);
        } else if (this.background) {
          this.setBackground(this.background);
        }
        if (this.beautify) {
          this.effects.enableBeautification();
        } else {
          this.effects.disableBeautification();
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

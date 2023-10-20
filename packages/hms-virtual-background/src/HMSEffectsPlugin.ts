/* eslint-disable complexity */
import { tsvb } from 'effects-sdk';
import {
  HMSMediaStream,
  HMSPluginSupportResult,
  HMSPluginUnsupportedTypes,
  HMSVideoPlugin,
  HMSVideoPluginType,
} from '@100mslive/hms-video';
import { HMSVirtualBackgroundTypes } from './interfaces';

export class HMSEffectsPlugin implements HMSVideoPlugin {
  // private TAG = '[HMSEffectsPlugin]';
  private background: string; // effects only needs the media URL
  private backgroundType: string; // effects only needs the media URL

  // private outputCanvas?: HTMLCanvasElement;
  // private outputCtx?: CanvasRenderingContext2D | null;
  private effectsSDK: any;

  constructor(background: string, backgroundType: string) {
    this.background = background;
    this.backgroundType = backgroundType;
    this.effectsSDK = new tsvb('22d268435824179e93a2e3da317306dfb0c72f7a');
    this.effectsSDK.config({
      models: {
        colorcorrector: '',
        facedetector: '',
      },
    });
  }

  isSupported(): boolean {
    return this.checkSupport().isSupported;
  }

  checkSupport(): HMSPluginSupportResult {
    const browserResult = {} as HMSPluginSupportResult;
    if (['Chrome', 'Firefox', 'Edg', 'Edge'].some(value => navigator.userAgent.indexOf(value) !== -1)) {
      browserResult.isSupported = true;
    } else {
      browserResult.isSupported = false;
      browserResult.errType = HMSPluginUnsupportedTypes.PLATFORM_NOT_SUPPORTED;
      browserResult.errMsg = 'browser not supported for plugin, see docs';
    }

    return browserResult;
  }

  getName(): string {
    return 'HMSVB';
  }

  getPluginType(): HMSVideoPluginType {
    return HMSVideoPluginType.TRANSFORM;
  }

  async init(): Promise<void> {
    this.effectsSDK.onReady = () => {
      console.debug("effects SDK is ready let's run it");
      this.effectsSDK.run();
      // available preset mode = 'quality | balanced | speed | lightning'
      this.effectsSDK.setSegmentationPreset('balanced');
      // available fit mode = 'fill | fit'
      this.effectsSDK.setBackgroundFitMode('fill');
    };
  }

  processInputStream(inputStream: HMSMediaStream): void {
    this.effectsSDK.useStream(inputStream);
    if (this.backgroundType === HMSVirtualBackgroundTypes.BLUR) {
      this.effectsSDK.setBlur(this.background);
    } else if (this.backgroundType === HMSVirtualBackgroundTypes.URL) {
      this.effectsSDK.setBackground(this.background);
    }

    /* effectsSDK.getStream() returns the processed stream
    
    Alternative: effectsSDK.toCanvas
    Set the canvas where the processed frames will be rendered

    toCanvas(canvas: HTMLCanvasElement): void
    
     */
  }

  stop(): void {}
}

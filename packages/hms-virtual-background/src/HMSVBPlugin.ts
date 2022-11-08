/* eslint-disable complexity */
import { Results, SelfieSegmentation } from '@mediapipe/selfie_segmentation';
import { decompressFrames, parseGIF } from 'gifuct-js';
import {
  HMSPluginSupportResult,
  HMSPluginUnsupportedTypes,
  HMSVideoPlugin,
  HMSVideoPluginType,
} from '@100mslive/hms-video';

const TAG = '[VBProcessor]';
export class HMSVBPlugin implements HMSVideoPlugin {
  background: string | HTMLImageElement | HTMLVideoElement;
  isVirtualBackground: boolean;
  backgroundType: 'image' | 'video' | 'gif' | 'none' | 'blur' = 'none';
  segmentation!: SelfieSegmentation;
  outputCanvas?: HTMLCanvasElement;
  outputCtx?: CanvasRenderingContext2D | null;

  gifFrames: any;
  gifFramesIndex: number;
  gifFrameImageData: any;
  tempGifCanvas: HTMLCanvasElement;
  tempGifContext: any;
  giflocalCount: number;

  constructor(background: string) {
    this.background = background;
    this.isVirtualBackground = false;
    this.gifFrames = null;
    this.gifFramesIndex = 0;
    this.gifFrameImageData = null;
    this.tempGifCanvas = document.createElement('canvas');
    this.tempGifContext = this.tempGifCanvas.getContext('2d');
    this.giflocalCount = 0;

    this.log(TAG, 'Virtual Background plugin created');
    this.setBackground(this.background);
  }

  isSupported(): boolean {
    return this.checkSupport().isSupported;
  }

  async init(): Promise<void> {
    if (!this.segmentation) {
      this.segmentation = new SelfieSegmentation({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1/${file}`;
        },
      });
      this.segmentation.setOptions({ selfieMode: false, modelSelection: 1 });
      this.segmentation.onResults(this.handleResults);
    }
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

  async setBackground(bg: string | HTMLImageElement | HTMLVideoElement) {
    if (!bg) {
      throw new Error('Invalid background supplied, see the docs to check supported background type');
    }
    if (bg === 'none' || bg === 'blur') {
      this.background = bg;
      this.backgroundType = bg;
      this.isVirtualBackground = false;
    } else if (bg instanceof HTMLImageElement) {
      this.log('setting background to image', bg);
      const img = await this.setImage(bg as HTMLImageElement);
      if (!img || !img.complete || !img.naturalHeight) {
        throw new Error('Invalid image. Provide a valid and successfully loaded HTMLImageElement');
      } else {
        this.isVirtualBackground = true;
        this.background = img;
        this.backgroundType = 'image';
      }
    } else if (bg instanceof HTMLVideoElement) {
      this.log('setting background to video', bg);
      this.background = bg as HTMLVideoElement;
      this.background.crossOrigin = 'anonymous';
      this.background.muted = true;
      this.background.loop = true;
      this.background.oncanplaythrough = async () => {
        if (this.background != null) {
          await (this.background! as HTMLVideoElement).play();
          this.isVirtualBackground = true;
          this.backgroundType = 'video';
        }
      };
    } else if (typeof bg === 'string') {
      console.log('setting gif to background');
      this.gifFrames = await this.setGiF(bg as string);
      if (this.gifFrames != null && this.gifFrames.length > 0) {
        this.backgroundType = 'gif';
        this.isVirtualBackground = true;
      } else {
        throw new Error('Invalid background supplied, see the docs to check supported background type');
      }
    }
  }

  stop(): void {
    this.segmentation?.reset();
    //gif related
    this.gifFrameImageData = null;
    this.gifFrames = null;
    this.giflocalCount = 0;
    this.gifFramesIndex = 0;
  }

  async processVideoFrame(input: HTMLCanvasElement, output: HTMLCanvasElement, skipProcessing?: boolean) {
    if (!input || !output) {
      throw new Error('Plugin invalid input/output');
    }
    if (skipProcessing) {
      return;
    }
    output.width = input.width;
    output.height = input.height;
    this.outputCanvas = output;
    this.outputCtx = output.getContext('2d');
    await this.segmentation.send({ image: input });
  }

  private async setImage(image: HTMLImageElement): Promise<any> {
    image.crossOrigin = 'anonymous';
    return new Promise((resolve, reject) => {
      image.onload = () => resolve(image);
      image.onerror = reject;
    });
  }

  private handleResults = (results: Results) => {
    if (!this.outputCanvas || !this.outputCtx) {
      return;
    }
    this.outputCtx.save();
    this.outputCtx.clearRect(0, 0, this.outputCanvas.width, this.outputCanvas.height);
    // Only overwrite existing pixels.
    if (typeof this.background !== 'string') {
      this.outputCtx?.drawImage(results.segmentationMask, 0, 0, this.outputCanvas.width, this.outputCanvas.height);
      this.outputCtx.filter = 'none';
      this.outputCtx.imageSmoothingEnabled = true;
      this.outputCtx.imageSmoothingQuality = 'high';
      this.outputCtx.globalCompositeOperation = 'source-out';
      this.outputCtx.drawImage(
        this.background,
        0,
        0,
        this.background.width,
        this.background.height,
        0,
        0,
        this.outputCanvas.width,
        this.outputCanvas.height,
      );
      // Only overwrite missing pixels.
      this.outputCtx.globalCompositeOperation = 'destination-atop';
      this.outputCtx.drawImage(results.image, 0, 0, this.outputCanvas.width, this.outputCanvas.height);
    } else {
      this.outputCtx!.filter = 'none';
      this.outputCtx!.globalCompositeOperation = 'source-out';
      this.outputCtx?.drawImage(results.image, 0, 0, this.outputCanvas.width, this.outputCanvas.height);
      this.outputCtx!.globalCompositeOperation = 'destination-atop';
      this.outputCtx?.drawImage(results.segmentationMask, 0, 0, this.outputCanvas.width, this.outputCanvas.height);
      this.outputCtx!.filter = `blur(${Math.floor(this.outputCanvas.width / 160) * 5}px)`;
      this.outputCtx?.drawImage(results.image, 0, 0, this.outputCanvas.width, this.outputCanvas.height);
    }
    this.outputCtx.restore();
  };

  private setGiF(url: string): Promise<any> {
    return fetch(url)
      .then(resp => resp.arrayBuffer())
      .then(buff => parseGIF(buff))
      .then(gif => {
        return decompressFrames(gif, true);
      });
  }

  private log(tag: string, ...data: any[]) {
    console.debug(tag, ...data);
  }
}

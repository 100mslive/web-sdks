/* eslint-disable complexity */
import { Results as MediaPipeResults, SelfieSegmentation } from '@mediapipe/selfie_segmentation';
import { decompressFrames, parseGIF } from 'gifuct-js';
import {
  HMSPluginSupportResult,
  HMSPluginUnsupportedTypes,
  HMSVideoPlugin,
  HMSVideoPluginType,
} from '@100mslive/hms-video';

const TAG = '[VBProcessor]';
type HMSBackgroundInput = HTMLImageElement | HTMLVideoElement | HTMLCanvasElement;
export type HMSVirtualBackground = 'blur' | 'none' | HMSBackgroundInput;
type HMSVirtualBackgroundType = 'blur' | 'none' | 'gif' | 'image' | 'video' | 'canvas';

export class HMSVBPlugin implements HMSVideoPlugin {
  background: HMSVirtualBackground;
  backgroundType: HMSVirtualBackgroundType = 'none';
  segmentation!: SelfieSegmentation;
  outputCanvas?: HTMLCanvasElement;
  outputCtx?: CanvasRenderingContext2D | null;

  gifFrames: any;
  gifFramesIndex: number;
  gifFrameImageData: any;
  tempGifCanvas: HTMLCanvasElement;
  tempGifContext: any;
  giflocalCount: number;

  constructor(background: HMSVirtualBackground) {
    this.background = background;
    this.gifFrames = null;
    this.gifFramesIndex = 0;
    this.gifFrameImageData = null;
    this.tempGifCanvas = document.createElement('canvas');
    this.tempGifContext = this.tempGifCanvas.getContext('2d');
    this.giflocalCount = 0;

    this.log('Virtual Background plugin created');
    this.setBackground(this.background);
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

  async setBackground(bg: HMSVirtualBackground) {
    if (!bg) {
      throw new Error('Invalid background supplied, see the docs to check supported background type');
    }
    if (bg === 'none' || bg === 'blur') {
      this.background = bg;
      this.backgroundType = bg;
    } else if (bg instanceof HTMLImageElement) {
      this.log('setting background to image', bg);
      const img = await this.setImage(bg);
      if (!img || !img.complete || !img.naturalHeight) {
        throw new Error('Invalid image. Provide a valid and successfully loaded HTMLImageElement');
      } else {
        this.background = img;
        this.backgroundType = 'image';
      }
    } else if (bg instanceof HTMLVideoElement) {
      this.log('setting background to video', bg);
      this.background = bg;
      this.background.crossOrigin = 'anonymous';
      this.background.muted = true;
      this.background.loop = true;
      this.background.oncanplaythrough = async () => {
        await (this.background as HTMLVideoElement)?.play();
        this.backgroundType = 'video';
      };
    } else if (bg instanceof HTMLCanvasElement) {
      this.background = bg;
      this.backgroundType = 'canvas';
    } else if (typeof bg === 'string') {
      this.log('setting gif to background', bg);
      this.gifFrames = await this.loadGIF(bg);
      this.background = bg;
      if (this.gifFrames != null && this.gifFrames.length > 0) {
        this.backgroundType = 'gif';
      } else {
        throw new Error('Invalid background supplied, see the docs to check supported background type');
      }
    }
  }

  stop(): void {
    if (this.background !== 'blur' && this.background !== 'none') {
      this.segmentation?.reset();
    }
    //gif related
    this.gifFrameImageData = null;
    this.gifFrames = null;
    this.giflocalCount = 0;
    this.gifFramesIndex = 0;
    this.background = 'none';
    this.backgroundType = 'none';
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
    if (this.background === 'none') {
      this.outputCtx?.drawImage(input, 0, 0, input.width, input.height);
      return;
    }
    await this.segmentation.send({ image: input });
  }

  private async setImage(image: HTMLImageElement): Promise<any> {
    image.crossOrigin = 'anonymous';
    return new Promise((resolve, reject) => {
      image.onload = () => resolve(image);
      image.onerror = reject;
    });
  }

  private handleResults = (results: MediaPipeResults) => {
    if (!this.outputCanvas || !this.outputCtx) {
      return;
    }
    this.outputCtx.save();
    this.outputCtx.clearRect(0, 0, this.outputCanvas.width, this.outputCanvas.height);
    if (typeof this.background !== 'string') {
      this.renderBackground(results, this.background);
    } else if (this.background === 'blur') {
      this.renderBlur(results);
    } else if (this.backgroundType === 'gif') {
      this.renderGIF(results);
    }
    this.outputCtx.restore();
  };

  private loadGIF(url: string): Promise<any> {
    return fetch(url)
      .then(resp => resp.arrayBuffer())
      .then(buff => parseGIF(buff))
      .then(gif => {
        return decompressFrames(gif, true);
      });
  }

  private log(...data: any[]) {
    console.debug(TAG, ...data);
  }

  private renderBackground = (results: MediaPipeResults, background: HMSBackgroundInput) => {
    if (!this.outputCanvas || !this.outputCtx || this.backgroundType === 'none' || this.backgroundType === 'blur') {
      return;
    }
    this.outputCtx?.drawImage(results.segmentationMask, 0, 0, this.outputCanvas.width, this.outputCanvas.height);
    this.outputCtx.filter = 'none';
    this.outputCtx.imageSmoothingEnabled = true;
    this.outputCtx.imageSmoothingQuality = 'high';
    // Only overwrite existing pixels.
    this.outputCtx.globalCompositeOperation = 'source-out';
    this.outputCtx.drawImage(
      background,
      0,
      0,
      background.width,
      background.height,
      0,
      0,
      this.outputCanvas.width,
      this.outputCanvas.height,
    );
    // Only overwrite missing pixels.
    this.outputCtx.globalCompositeOperation = 'destination-atop';
    this.outputCtx.drawImage(results.image, 0, 0, this.outputCanvas.width, this.outputCanvas.height);
  };

  private renderBlur(results: MediaPipeResults) {
    if (!this.outputCanvas || !this.outputCtx || this.backgroundType !== 'blur') {
      return;
    }
    this.outputCtx!.filter = 'none';
    this.outputCtx!.globalCompositeOperation = 'source-out';
    this.outputCtx?.drawImage(results.image, 0, 0, this.outputCanvas.width, this.outputCanvas.height);
    this.outputCtx!.globalCompositeOperation = 'destination-atop';
    this.outputCtx?.drawImage(results.segmentationMask, 0, 0, this.outputCanvas.width, this.outputCanvas.height);
    this.outputCtx!.filter = `blur(${Math.floor(this.outputCanvas.width / 160) * 5}px)`;
    this.outputCtx?.drawImage(results.image, 0, 0, this.outputCanvas.width, this.outputCanvas.height);
  }

  private renderGIF(results: MediaPipeResults) {
    if (!this.outputCanvas || !this.outputCtx || this.backgroundType !== 'gif') {
      return;
    }
    if (this.gifFrameImageData == null) {
      const dims = this.gifFrames[this.gifFramesIndex].dims;
      this.tempGifCanvas.width = dims.width;
      this.tempGifCanvas.height = dims.height;
      this.gifFrameImageData = this.tempGifContext.createImageData(dims.width, dims.height);
    }
    // set the patch data as an override
    this.gifFrameImageData.data.set(this.gifFrames[this.gifFramesIndex].patch);
    this.tempGifContext.putImageData(this.gifFrameImageData, 0, 0);
    this.gifFramesIndex = (this.gifFramesIndex + 1) % this.gifFrames.length;
    this.renderBackground(results, this.tempGifCanvas);
  }
}

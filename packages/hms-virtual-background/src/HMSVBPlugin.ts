/* eslint-disable complexity */
import * as bodySegmentation from '@tensorflow-models/body-segmentation';
// Register WebGL backend.
import '@tensorflow/tfjs-backend-webgl';
import { parseGIF, decompressFrames } from 'gifuct-js';
import {
  HMSPluginSupportResult,
  HMSPluginUnsupportedTypes,
  HMSVideoPlugin,
  HMSVideoPluginType,
} from '@100mslive/hms-video';

const TAG = 'VBProcessor';

export class HMSVBPlugin implements HMSVideoPlugin {
  background: string | HTMLImageElement | HTMLVideoElement;
  personMaskWidth: number;
  personMaskHeight: number;
  isVirtualBackground: boolean;
  backgroundImage: HTMLImageElement | null;
  backgroundVideo: HTMLVideoElement | null;
  backgroundType = 'none';
  loadModelCalled: boolean;
  blurValue: any;
  segmenter!: bodySegmentation.BodySegmenter;
  modelName: string;

  outputCtx: CanvasRenderingContext2D | null;
  timerID: number;
  imageAspectRatio: number;

  personMaskPixelCount: number;
  personMask: ImageData;
  personMaskCanvas: HTMLCanvasElement;
  personMaskCtx: CanvasRenderingContext2D | null;
  filters: any;
  enableSharpening?: boolean | false;

  gifFrames: any;
  gifFramesIndex: number;
  gifFrameImageData: any;
  tempGifCanvas: HTMLCanvasElement;
  tempGifContext: any;
  giflocalCount: number;

  constructor(background: string, enableSharpening = false) {
    this.background = background;
    this.enableSharpening = enableSharpening;

    this.backgroundImage = null;
    this.backgroundVideo = null;

    this.personMaskWidth = 256;
    this.personMaskHeight = 144;
    this.isVirtualBackground = false;
    this.blurValue = '10px';
    this.loadModelCalled = false;
    this.modelName = 'landscape-segmentation';

    this.outputCtx = null;
    this.timerID = 0;
    this.imageAspectRatio = 1;

    this.personMaskPixelCount = this.personMaskWidth * this.personMaskHeight;
    this.personMask = new ImageData(this.personMaskWidth, this.personMaskHeight);
    this.personMaskCanvas = document.createElement('canvas');
    this.personMaskCanvas.width = this.personMaskWidth;
    this.personMaskCanvas.height = this.personMaskHeight;
    this.personMaskCtx = this.personMaskCanvas.getContext('2d');

    this.filters = {};
    this.gifFrames = null;
    this.gifFramesIndex = 0;
    this.gifFrameImageData = null;
    this.tempGifCanvas = document.createElement('canvas');
    this.tempGifContext = this.tempGifCanvas.getContext('2d');
    this.giflocalCount = 0;
    this.enableSharpening = enableSharpening;

    this.log(TAG, 'Virtual Background plugin created');
    this.setBackground(this.background);
  }
  isSupported(): boolean {
    throw new Error('Method not implemented.');
  }

  async init(): Promise<void> {
    const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation;
    const segmenterConfig: bodySegmentation.MediaPipeSelfieSegmentationTfjsModelConfig = {
      runtime: 'tfjs',
    };
    this.segmenter = await bodySegmentation.createSegmenter(model, segmenterConfig);
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

  async setBackground(path?: string | HTMLImageElement | HTMLVideoElement) {
    if (path !== '') {
      if (path === 'none') {
        this.log(TAG, 'setting background to :', path);
        this.background = 'none';
        this.backgroundType = 'none';
        this.isVirtualBackground = false;
      } else if (path === 'blur') {
        this.log(TAG, 'setting background to :', path);
        this.background = 'blur';
        this.backgroundType = 'blur';
        this.isVirtualBackground = false;
      } else if (path instanceof HTMLImageElement) {
        this.log('setting background to image', path);
        const img = await this.setImage(path as HTMLImageElement);
        if (!img || !img.complete || !img.naturalHeight) {
          throw new Error('Invalid image. Provide a valid and successfully loaded HTMLImageElement');
        } else {
          this.isVirtualBackground = true;
          this.background = img;
          this.backgroundType = 'image';
        }
      } else if (path instanceof HTMLVideoElement) {
        this.log('setting background to video', path);
        this.background = path as HTMLVideoElement;
        this.background.crossOrigin = 'anonymous';
        this.background.muted = true;
        this.background.loop = true;
        this.background.oncanplaythrough = async () => {
          if (this.backgroundVideo != null) {
            await this.backgroundVideo!.play();
            this.isVirtualBackground = true;
            this.backgroundType = 'video';
          }
        };
      } else {
        console.log('setting gif to background');
        this.gifFrames = await this.setGiF(path as string);
        if (this.gifFrames != null && this.gifFrames.length > 0) {
          this.backgroundType = 'gif';
          this.isVirtualBackground = true;
        } else {
          throw new Error('Invalid background supplied, see the docs to check supported background type');
        }
      }
    } else {
      throw new Error('Invalid background supplied, see the docs to check supported background type');
    }
  }

  stop(): void {
    if (this.isVirtualBackground) {
      this.backgroundImage?.removeAttribute('src');
      this.backgroundVideo?.removeAttribute('src');
      if (this.backgroundType === 'video') {
        this.backgroundVideo!.loop = false;
        this.backgroundVideo = null;
      }
    }
    if (this.outputCtx) {
      this.outputCtx!.fillStyle = `rgba(0, 0, 0, 0)`;
      this.outputCtx!.fillRect(0, 0, this.outputCtx!.canvas.width, this.outputCtx!.canvas.height);
    }

    //gif related
    this.gifFrameImageData = null;
    this.gifFrames = null;
    this.giflocalCount = 0;
    this.gifFramesIndex = 0;
  }

  async processVideoFrame(input: HTMLCanvasElement, output: HTMLCanvasElement) {
    if (!input || !output) {
      throw new Error('Plugin invalid input/output');
    }
    const segmentationConfig = { flipHorizontal: true };
    const people = await this.segmenter.segmentPeople(input, segmentationConfig);
    const foregroundColor = { r: 0, g: 0, b: 0, a: 0 };
    const backgroundColor = { r: 0, g: 0, b: 0, a: 255 };
    const mask = await bodySegmentation.toBinaryMask(people, foregroundColor, backgroundColor, false);
    output.width = input.width;
    output.height = input.height;
    const ctx = output.getContext('2d');
    this.outputCtx = ctx;
    if (typeof this.background !== 'string') {
      ctx!.imageSmoothingEnabled = true;
      ctx!.imageSmoothingQuality = 'high';
      ctx!.drawImage(this.background, 0, 0, input.width, input.height);
      ctx!.filter = 'none';
      this.personMaskCanvas.width = mask.width;
      this.personMaskCanvas.height = mask.height;
      this.personMaskCtx!.putImageData(mask, 0, 0);
      ctx!.globalCompositeOperation = 'destination-atop';
      ctx!.drawImage(this.personMaskCanvas, 0, 0, mask.width, mask.height, 0, 0, input.width, input.height);
      ctx!.globalCompositeOperation = 'destination-over';
      // Draw the foreground
      ctx!.drawImage(input, 0, 0, mask.width, mask.height, 0, 0, input.width, input.height);
    } else if (this.background === 'blur') {
      await bodySegmentation.drawBokehEffect(output, input, people, 0.5, 15, 1, false);
    }
  }

  private async setImage(image: HTMLImageElement): Promise<any> {
    image.crossOrigin = 'anonymous';
    return new Promise((resolve, reject) => {
      image.onload = () => resolve(image);
      image.onerror = reject;
    });
  }

  private setGiF(url: string): Promise<any> {
    return fetch(url)
      .then(resp => resp.arrayBuffer())
      .then(buff => parseGIF(buff))
      .then(gif => {
        return decompressFrames(gif, true);
      });
  }

  private log(tag: string, ...data: any[]) {
    console.info(tag, ...data);
  }
}

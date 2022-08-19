import * as bodySegmentation from '@tensorflow-models/body-segmentation';
// Register WebGL backend.
import '@tensorflow/tfjs-backend-webgl';
import { parseGIF, decompressFrames, ParsedFrame } from 'gifuct-js';
import {
  HMSPluginSupportResult,
  HMSPluginUnsupportedTypes,
  HMSVideoPlugin,
  HMSVideoPluginType,
} from '@100mslive/hms-video';

const TAG = 'VBProcessor';
const segmentationConfig = { flipHorizontal: true };
const foregroundColor = { r: 0, g: 0, b: 0, a: 0 };
const backgroundColor = { r: 0, g: 0, b: 0, a: 255 };

type VBBackgroundType = string | HTMLImageElement | HTMLVideoElement;
export class HMSVBPlugin implements HMSVideoPlugin {
  background: VBBackgroundType;
  isVirtualBackground: boolean;
  backgroundType = 'none';
  segmenter!: bodySegmentation.BodySegmenter;
  outputCtx: CanvasRenderingContext2D | null;
  personMaskCanvas: HTMLCanvasElement;
  personMaskCtx: CanvasRenderingContext2D | null;

  gifFrames: ParsedFrame[] = [];
  gifFramesIndex: number;
  gifFrameImageData: any;
  tempGifCanvas: HTMLCanvasElement;
  tempGifContext: CanvasRenderingContext2D | null;
  giflocalCount: number;

  constructor(background: string) {
    this.background = background;
    this.isVirtualBackground = false;
    this.outputCtx = null;
    this.personMaskCanvas = document.createElement('canvas');
    this.personMaskCtx = this.personMaskCanvas.getContext('2d');
    this.gifFrames = [];
    this.gifFramesIndex = 0;
    this.gifFrameImageData = null;
    this.tempGifCanvas = document.createElement('canvas');
    this.tempGifContext = this.tempGifCanvas.getContext('2d');
    this.giflocalCount = 0;

    this.log(TAG, 'Virtual Background plugin created');
    this.setBackground(this.background);
    this.init();
  }

  isSupported(): boolean {
    return this.checkSupport().isSupported;
  }

  async init(): Promise<void> {
    if (!this.segmenter) {
      const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation;
      const segmenterConfig: bodySegmentation.MediaPipeSelfieSegmentationTfjsModelConfig = {
        runtime: 'tfjs',
      };
      this.segmenter = await bodySegmentation.createSegmenter(model, segmenterConfig);
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

  async setBackground(bg: VBBackgroundType) {
    if (!bg) {
      throw new Error('Invalid background supplied, see the docs to check supported background type');
    }
    await this.setImage(bg);
    if (bg === 'none' || bg === 'blur') {
      this.background = bg;
      this.backgroundType = bg;
      this.isVirtualBackground = false;
    } else if (bg instanceof HTMLVideoElement) {
      this.log('setting background to video', bg);
      this.background = bg as HTMLVideoElement;
      this.background.crossOrigin = 'anonymous';
      this.background.muted = true;
      this.background.loop = true;
      this.background.oncanplaythrough = async () => {
        await (this.background! as HTMLVideoElement).play();
        this.isVirtualBackground = true;
        this.backgroundType = 'video';
      };
    } else {
      await this.setGiF(bg as string);
    }
  }

  stop(): void {
    if (this.isVirtualBackground && typeof this.background !== 'string') {
      this.outputCtx!.fillStyle = `rgba(0, 0, 0, 0)`;
      this.outputCtx!.fillRect(0, 0, this.outputCtx!.canvas.width, this.outputCtx!.canvas.height);
    }
    if (this.segmenter) {
      this.segmenter.dispose();
    }

    //gif related
    this.gifFrameImageData = null;
    this.gifFrames = [];
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
    const ctx = output.getContext('2d');
    if (this.background === 'none') {
      ctx!.drawImage(input, 0, 0, input.width, input.height);
      return;
    }
    const people = await this.segmenter.segmentPeople(input, segmentationConfig);
    if (this.background === 'blur') {
      await bodySegmentation.drawBokehEffect(output, input, people, 0.5, 15, 1, false);
      return;
    }
    ctx!.filter = 'none';
    this.drawImageOnCanvas(ctx!);
    this.drawGifOnCanvas(ctx!);
    const mask = await bodySegmentation.toBinaryMask(people, foregroundColor, backgroundColor, false);
    this.personMaskCanvas.width = mask.width;
    this.personMaskCanvas.height = mask.height;
    this.personMaskCtx!.putImageData(mask, 0, 0);
    ctx!.globalCompositeOperation = 'destination-atop';
    ctx!.drawImage(this.personMaskCanvas, 0, 0, mask.width, mask.height, 0, 0, input.width, input.height);
    ctx!.globalCompositeOperation = 'destination-over';
    // Draw the foreground
    ctx!.drawImage(input, 0, 0, mask.width, mask.height, 0, 0, input.width, input.height);
  }

  private drawImageOnCanvas(ctx: CanvasRenderingContext2D) {
    if (!(this.background instanceof HTMLImageElement)) {
      return;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      this.background,
      0,
      0,
      this.background.width,
      this.background.height,
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height,
    );
  }

  private drawGifOnCanvas(ctx: CanvasRenderingContext2D) {
    if (this.backgroundType !== 'gif') {
      return;
    }
    const dims = this.gifFrames[this.gifFramesIndex].dims;
    this.tempGifCanvas!.width = dims.width;
    this.tempGifCanvas!.height = dims.height;
    if (!this.gifFrameImageData) {
      this.gifFrameImageData = this.tempGifContext!.createImageData(dims.width, dims.height);
    }
    this.gifFrameImageData.data.set(this.gifFrames[this.gifFramesIndex].patch);
    this.tempGifContext!.putImageData(this.gifFrameImageData, 0, 0);
    this.gifFramesIndex++;
    if (this.gifFramesIndex >= this.gifFrames.length) {
      this.gifFramesIndex = 0;
    }
    ctx.drawImage(this.tempGifCanvas, 0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  private async setImage(background: VBBackgroundType): Promise<void> {
    if (!(background instanceof HTMLImageElement)) {
      return;
    }
    this.log('setting background to image', background);
    background.crossOrigin = 'anonymous';
    return new Promise((resolve, reject) => {
      background.onload = () => {
        resolve();
        if (!background || !background.complete || !background.naturalHeight) {
          throw new Error('Invalid image. Provide a valid and successfully loaded HTMLImageElement');
        } else {
          this.isVirtualBackground = true;
          this.background = background;
          this.backgroundType = 'image';
        }
      };
      background.onerror = reject;
    });
  }

  private async setGiF(url: string): Promise<void> {
    this.log('setting gif to background', url);
    const resp = await fetch(url);
    const buff = await resp.arrayBuffer();
    const gif = await parseGIF(buff);
    this.gifFrames = decompressFrames(gif, true);
    if (this.gifFrames?.length) {
      this.background = 'gif';
      this.backgroundType = 'gif';
      this.isVirtualBackground = true;
    } else {
      throw new Error('Invalid background supplied, see the docs to check supported background type');
    }
  }

  private log(tag: string, ...data: any[]) {
    console.info(tag, ...data);
  }
}

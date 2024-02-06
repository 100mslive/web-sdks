/* eslint-disable complexity */
import { Results as MediaPipeResults, SelfieSegmentation } from '@mediapipe/selfie_segmentation';
import { decompressFrames, parseGIF } from 'gifuct-js';
import {
  HMSPluginSupportResult,
  HMSPluginUnsupportedTypes,
  HMSVideoPlugin,
  HMSVideoPluginType,
} from '@100mslive/hms-video-store';
import { HMSBackgroundInput, HMSVirtualBackground, HMSVirtualBackgroundTypes } from './interfaces';

export class HMSVBPlugin implements HMSVideoPlugin {
  private TAG = '[HMSVBPlugin]';
  private background: HMSVirtualBackground = HMSVirtualBackgroundTypes.NONE;
  private backgroundType: HMSVirtualBackgroundTypes = HMSVirtualBackgroundTypes.NONE;
  private segmentation!: SelfieSegmentation;
  private outputCanvas?: HTMLCanvasElement;
  private outputCtx?: CanvasRenderingContext2D | null;

  private gifFrames: any;
  private gifFramesIndex: number;
  private gifFrameImageData: any;
  private tempGifCanvas: HTMLCanvasElement;
  private tempGifContext: CanvasRenderingContext2D | null;
  private prevResults?: MediaPipeResults;
  private input?: HTMLCanvasElement;

  constructor(background: HMSVirtualBackground, backgroundType: HMSVirtualBackgroundTypes) {
    this.background = background;
    this.backgroundType = backgroundType;
    this.gifFrames = null;
    this.gifFramesIndex = 0;
    this.gifFrameImageData = null;
    this.tempGifCanvas = document.createElement('canvas');
    this.tempGifContext = this.tempGifCanvas.getContext('2d');

    this.setBackground(this.background, this.backgroundType);
    this.log('Virtual background plugin initialised');
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

  /**
   * For bgType HMSVirtualBackgroundTypes.IMAGE pass bg as an image element
   * For bgType HMSVirtualBackgroundTypes.VIDEO pass video
   * For bgType HMSVirtualBackgroundTypes.GIF pass the gif url
   * @param {HMSVirtualBackground} background
   * @param {HMSVirtualBackgroundTypes} backgroundType
   */
  async setBackground(background: HMSVirtualBackground, backgroundType: HMSVirtualBackgroundTypes) {
    if (!background) {
      throw new Error('Invalid background supplied, see the docs to check supported background type');
    }
    this.prevResults = undefined;
    switch (backgroundType) {
      case HMSVirtualBackgroundTypes.NONE:
      case HMSVirtualBackgroundTypes.BLUR:
        this.background = background;
        this.backgroundType = backgroundType;
        break;
      case HMSVirtualBackgroundTypes.IMAGE:
        this.log('setting background to image', background);
        // eslint-disable-next-line no-case-declarations
        const img = await this.setImage(background as HTMLImageElement);
        if (!img || !img.complete || !img.naturalHeight) {
          throw new Error('Invalid image. Provide a valid and successfully loaded HTMLImageElement');
        } else {
          this.background = img;
          this.backgroundType = HMSVirtualBackgroundTypes.IMAGE;
        }
        break;
      case HMSVirtualBackgroundTypes.VIDEO:
        this.log('setting background to video', background);
        this.backgroundType = HMSVirtualBackgroundTypes.NONE;
        this.background = background as HTMLVideoElement;
        this.background.crossOrigin = 'anonymous';
        this.background.muted = true;
        this.background.loop = true;
        this.background.playsInline = true;
        this.background.oncanplaythrough = async () => {
          if (this.background && this.background instanceof HTMLVideoElement) {
            try {
              await this.background.play();
              this.backgroundType = HMSVirtualBackgroundTypes.VIDEO;
            } catch (e) {
              this.log('failed to play background', background);
            }
          }
        };
        break;
      case HMSVirtualBackgroundTypes.CANVAS:
        this.background = background;
        this.backgroundType = HMSVirtualBackgroundTypes.CANVAS;
        break;
      case HMSVirtualBackgroundTypes.GIF:
        this.log('setting gif to background', background);
        this.backgroundType = HMSVirtualBackgroundTypes.NONE;
        this.background = background as string;
        this.gifFrames = await this.loadGIF(this.background);
        if (this.gifFrames != null && this.gifFrames.length > 0) {
          this.backgroundType = HMSVirtualBackgroundTypes.GIF;
        } else {
          throw new Error('Invalid background supplied, see the docs to check supported background type');
        }
        break;
      default:
        this.log(
          `backgroundType did not match with any of the supported background types - ${HMSVirtualBackgroundTypes}`,
        );
    }
  }

  getBackground() {
    return this.background;
  }

  stop(): void {
    if (this.backgroundType !== HMSVirtualBackgroundTypes.BLUR && this.background !== HMSVirtualBackgroundTypes.NONE) {
      this.segmentation?.reset();
    }
    //gif related
    this.gifFrameImageData = null;
    this.gifFrames = null;
    this.gifFramesIndex = 0;
    this.background = HMSVirtualBackgroundTypes.NONE;
    this.backgroundType = HMSVirtualBackgroundTypes.NONE;
  }

  async processVideoFrame(input: HTMLCanvasElement, output: HTMLCanvasElement, skipProcessing?: boolean) {
    if (!input || !output) {
      throw new Error('Plugin invalid input/output');
    }
    this.input = input;
    output.width = input.width;
    output.height = input.height;
    this.outputCanvas = output;
    this.outputCtx = output.getContext('2d');
    if (skipProcessing && this.prevResults) {
      this.handleResults(this.prevResults);
      return;
    }
    if (this.backgroundType === HMSVirtualBackgroundTypes.NONE) {
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
    switch (this.backgroundType) {
      case HMSVirtualBackgroundTypes.IMAGE:
      case HMSVirtualBackgroundTypes.CANVAS:
      case HMSVirtualBackgroundTypes.VIDEO:
        this.renderBackground(results, this.background as HMSBackgroundInput);
        break;
      case HMSVirtualBackgroundTypes.GIF:
        this.renderGIF(results);
        break;
      case HMSVirtualBackgroundTypes.BLUR:
        this.renderBlur(results);
        break;
    }
    this.outputCtx.restore();
    this.prevResults = results;
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
    console.debug(this.TAG, ...data);
  }

  private renderBackground = (results: MediaPipeResults, background: HMSBackgroundInput) => {
    if (
      !this.input ||
      !this.outputCanvas ||
      !this.outputCtx ||
      this.backgroundType === HMSVirtualBackgroundTypes.NONE ||
      this.backgroundType === HMSVirtualBackgroundTypes.BLUR
    ) {
      return;
    }
    this.outputCtx.filter = 'none';
    this.outputCtx.imageSmoothingEnabled = true;
    this.outputCtx.imageSmoothingQuality = 'high';
    // Only overwrite existing pixels.
    this.outputCtx.globalCompositeOperation = 'source-out';
    const bgWidth = background instanceof HTMLVideoElement ? background.videoWidth : background.width;
    const bgHeight = background instanceof HTMLVideoElement ? background.videoHeight : background.height;

    this.outputCtx.drawImage(
      background,
      0,
      0,
      bgWidth,
      bgHeight,
      0,
      0,
      this.outputCanvas.width,
      this.outputCanvas.height,
    );
    this.outputCtx.globalCompositeOperation = 'destination-out';
    this.outputCtx.drawImage(results.segmentationMask, 0, 0, this.outputCanvas.width, this.outputCanvas.height);
    // Only overwrite missing pixels.
    this.outputCtx.globalCompositeOperation = 'destination-atop';
    this.outputCtx.drawImage(this.input, 0, 0, this.outputCanvas.width, this.outputCanvas.height);
  };

  private renderBlur(results: MediaPipeResults) {
    if (!this.outputCanvas || !this.outputCtx || this.backgroundType !== HMSVirtualBackgroundTypes.BLUR) {
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
    if (
      !this.outputCanvas ||
      !this.outputCtx ||
      !this.tempGifContext ||
      this.backgroundType !== HMSVirtualBackgroundTypes.GIF
    ) {
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

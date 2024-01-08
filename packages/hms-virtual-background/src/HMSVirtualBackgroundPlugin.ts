/* eslint-disable complexity */
import { decompressFrames, parseGIF } from 'gifuct-js';
import {
  HMSPluginSupportResult,
  HMSPluginUnsupportedTypes,
  HMSVideoPlugin,
  HMSVideoPluginType,
} from '@100mslive/hms-video-store';
import '@tensorflow/tfjs-backend-webgl';
import { loadTFLite } from './defineTFLite';

const TAG = 'VBProcessor';
const DEFAULT_DELAY = 33;
const pkg = require('../package.json');

const minVideoWidthForSharpening = 214;
const maxVideoWidthForSharpening = 855;
const minVideoHeightForSharpening = 120;
const maxVideoHeightForSharpening = 720;

export class HMSVirtualBackgroundPlugin implements HMSVideoPlugin {
  background: string | HTMLImageElement;
  personMaskWidth: number;
  personMaskHeight: number;
  isVirtualBackground: boolean;
  backgroundImage: HTMLImageElement | null;
  backgroundVideo: HTMLVideoElement | null;
  backgroundType = 'none';
  loadModelCalled: boolean;
  blurValue: any;
  tfLite: any;
  tfLitePromise: any;
  modelName: string;

  input: HTMLCanvasElement | null;
  output: HTMLCanvasElement | null;
  outputCtx: CanvasRenderingContext2D | null;
  timerID: number;
  imageAspectRatio: number;

  personMaskPixelCount: number;
  personMask: ImageData;
  personMaskCanvas: HTMLCanvasElement;
  personMaskCtx: any;
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
    this.tfLite = null;
    this.modelName = 'landscape-segmentation';

    this.outputCtx = null;
    this.input = null;
    this.output = null;
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

  async init(): Promise<void> {
    if (!this.loadModelCalled) {
      this.log(TAG, 'PREVIOUS LOADED MODEL IS ', this.tfLite);
      this.loadModelCalled = true;
      this.tfLitePromise = loadTFLite();
      this.tfLite = await this.tfLitePromise;
    } else {
      //either it is loading or loaded
      await this.tfLitePromise;
    }
    if (this.enableSharpening) {
      this.initSharpenFilter();
    }
  }

  /*
  @depreceated
   */
  isSupported(): boolean {
    //support chrome, firefox, edge TODO: check this
    return (
      navigator.userAgent.indexOf('Chrome') !== -1 ||
      navigator.userAgent.indexOf('Firefox') !== -1 ||
      navigator.userAgent.indexOf('Edg') !== -1 ||
      navigator.userAgent.indexOf('Edge') !== -1
    );
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
    return pkg.name;
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
          this.backgroundImage = img;
          this.backgroundType = 'image';
        }
      } else if (path instanceof HTMLVideoElement) {
        this.log('setting background to video', path);
        this.backgroundVideo = path as HTMLVideoElement;
        this.backgroundVideo.crossOrigin = 'anonymous';
        this.backgroundVideo.muted = true;
        this.backgroundVideo.loop = true;
        this.backgroundVideo.oncanplaythrough = async () => {
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
      this.outputCtx!.fillStyle = `rgb(0, 0, 0)`;
      this.outputCtx!.fillRect(0, 0, this.output!.width, this.output!.height);
    }

    //gif related
    this.gifFrameImageData = null;
    this.gifFrames = null;
    this.giflocalCount = 0;
    this.gifFramesIndex = 0;
  }

  processVideoFrame(
    input: HTMLCanvasElement,
    output: HTMLCanvasElement,
    skipProcessing?: boolean,
  ): Promise<void> | void {
    if (!input || !output) {
      throw new Error('Plugin invalid input/output');
    }

    this.input = input;
    this.output = output;

    const ctx = output.getContext('2d');
    if (ctx!.canvas.width !== input.width) {
      ctx!.canvas.width = input.width;
    }
    if (ctx!.canvas.height !== input.height) {
      ctx!.canvas.height = input.height;
    }

    if (this.backgroundType === 'video') {
      this.backgroundVideo!.width = input.width;
      this.backgroundVideo!.height = input.height;
    }

    this.outputCtx = ctx!;
    this.imageAspectRatio = input.width / input.height;
    if (this.imageAspectRatio <= 0) {
      throw new Error('Invalid input width/height');
    }

    const process = async () => {
      await this.runSegmentation(skipProcessing);
    };

    if (this.background === 'none' && !this.isVirtualBackground) {
      this.outputCtx!.globalCompositeOperation = 'copy';
      this.outputCtx!.filter = 'none';
      this.outputCtx!.drawImage(input, 0, 0, input.width, input.height);
    } else {
      process();
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

  private resizeInputData() {
    this.personMaskCtx!.drawImage(
      this.input,
      0,
      0,
      this.input!.width,
      this.input!.height,
      0,
      0,
      this.personMaskWidth,
      this.personMaskHeight,
    );

    const imageData = this.personMaskCtx!.getImageData(0, 0, this.personMaskWidth, this.personMaskHeight);
    //
    const inputMemoryOffset = this.tfLite._getInputMemoryOffset() / 4;
    for (let i = 0; i < this.personMaskPixelCount; i++) {
      this.tfLite.HEAPF32[inputMemoryOffset + i * 3] = imageData.data[i * 4] / 255;
      this.tfLite.HEAPF32[inputMemoryOffset + i * 3 + 1] = imageData.data[i * 4 + 1] / 255;
      this.tfLite.HEAPF32[inputMemoryOffset + i * 3 + 2] = imageData.data[i * 4 + 2] / 255;
    }
  }
  private infer(skipProcessing?: boolean) {
    if (!skipProcessing) {
      this.tfLite._runInference();
    }
    const outputMemoryOffset = this.tfLite._getOutputMemoryOffset() / 4;

    for (let i = 0; i < this.personMaskPixelCount; i++) {
      if (this.modelName === 'meet') {
        const background = this.tfLite.HEAPF32[outputMemoryOffset + i * 2];
        const person = this.tfLite.HEAPF32[outputMemoryOffset + i * 2 + 1];
        const shift = Math.max(background, person);
        const backgroundExp = Math.exp(background - shift);
        const personExp = Math.exp(person - shift);
        // Sets only the alpha component of each pixel.
        this.personMask.data[i * 4 + 3] = (255 * personExp) / (backgroundExp + personExp);
      } else if (this.modelName === 'landscape-segmentation') {
        const person = this.tfLite.HEAPF32[outputMemoryOffset + i];
        this.personMask.data[i * 4 + 3] = 255 * person;
      }
    }

    this.personMaskCtx!.putImageData(this.personMask, 0, 0);
  }

  private postProcessing() {
    this.outputCtx!.globalCompositeOperation = 'copy';
    this.outputCtx!.filter = 'none';

    if (this.isVirtualBackground) {
      this.outputCtx!.filter = 'blur(4px)';
    } else {
      this.outputCtx!.filter = 'blur(8px)';
    }
    this.drawPersonMask();
    this.outputCtx!.globalCompositeOperation = 'source-in';
    this.outputCtx!.filter = 'none';
    // //Draw the foreground
    this.outputCtx!.drawImage(this.input!, 0, 0);

    if (
      this.enableSharpening &&
      this.output!.width > minVideoWidthForSharpening && // minimum and maximum resolution to enable sharpening filter
      this.output!.height > minVideoHeightForSharpening &&
      this.output!.width < maxVideoWidthForSharpening &&
      this.output!.height < maxVideoHeightForSharpening
    ) {
      this.sharpenFilter();
    }

    // //Draw the background
    this.drawSegmentedBackground();
  }

  private sharpenFilter() {
    // adding sharpening filter to each frame to improve edges and brightness
    // The basic idea is that you take the weighed sum of a rectangle of pixels from the source image and use that as the output value using convolution filter
    // It is applied intermediate output with black background and only mask data in frame
    // Filter currently used is 3 x 3 sharpening filter with values as shown:
    // [  0, -1,  0,
    //   -1,  5, -1,
    //   0, -1,  0 ]
    const outputImageData = this.outputCtx!.getImageData(0, 0, this.output!.width, this.output!.height);

    // filters you may try
    // [-1, -1, -1, -1, 9, -1, -1, -1, -1]
    //[0, -1, 0, -1, 5, -1, 0, -1, 0]
    const output = this.filters.convolute(outputImageData);

    this.outputCtx!.putImageData(output, 0, 0);
  }

  private drawPersonMask() {
    this.outputCtx!.drawImage(
      this.personMaskCanvas,
      0,
      0,
      this.personMaskWidth,
      this.personMaskHeight,
      0,
      0,
      this.output!.width,
      this.output!.height,
    );
  }

  private drawSegmentedBackground() {
    this.outputCtx!.globalCompositeOperation = 'destination-over';
    this.outputCtx!.imageSmoothingEnabled = true;
    this.outputCtx!.imageSmoothingQuality = 'high';
    if (this.isVirtualBackground) {
      if (this.backgroundType === 'video' && this.backgroundVideo != null && this.backgroundVideo!.readyState >= 4) {
        this.fitVideoToBackground();
      } else if (this.backgroundType === 'image') {
        this.fitImageToBackground();
      } else if (this.backgroundType === 'gif') {
        if (this.giflocalCount > this.gifFrames[this.gifFramesIndex].delay / DEFAULT_DELAY) {
          this.gifFramesIndex++;
          if (this.gifFramesIndex >= this.gifFrames.length) {
            this.gifFramesIndex = 0;
          }
          this.giflocalCount = 0;
        } else {
          this.giflocalCount++;
        }
        this.fitGifToBackground();
      }
    } else {
      this.addBlurToBackground();
    }
  }

  private async runSegmentation(skipProcessing?: boolean) {
    if (this.tfLite) {
      // const start = performance.now();

      this.resizeInputData();
      await this.infer(skipProcessing);
      this.postProcessing();
      // const end = performance.now();
      // this.log(TAG,"time taken",end -start);
    }
  }

  private fitVideoToBackground() {
    this.fitData(this.backgroundVideo, this.backgroundVideo!.videoWidth, this.backgroundVideo!.videoHeight);
  }

  private fitImageToBackground() {
    this.fitData(this.backgroundImage, this.backgroundImage!.width, this.backgroundImage!.height);
  }

  private fitGifToBackground() {
    if (this.gifFrameImageData == null) {
      const dims = this.gifFrames[this.gifFramesIndex].dims;
      this.tempGifCanvas!.width = dims.width;
      this.tempGifCanvas!.height = dims.height;
      this.gifFrameImageData = this.tempGifContext.createImageData(dims.width, dims.height);
    }
    // set the patch data as an override
    this.gifFrameImageData.data.set(this.gifFrames[this.gifFramesIndex].patch);
    this.tempGifContext.putImageData(this.gifFrameImageData, 0, 0);

    this.fitData(this.tempGifCanvas, this.gifFrameImageData!.width, this.gifFrameImageData!.height);
  }

  private fitData(data: any, dataWidth: number, dataHeight: number) {
    let inputWidth: any, inputHeight: any, xoffset: any, yoffset: any;
    if (dataWidth / dataHeight < this.imageAspectRatio) {
      inputWidth = dataWidth;
      inputHeight = dataWidth / this.imageAspectRatio;
      xoffset = 0;
      yoffset = (dataHeight - inputHeight) / 2;
    } else {
      inputHeight = dataHeight;
      inputWidth = dataHeight * this.imageAspectRatio;
      yoffset = 0;
      xoffset = (dataWidth - inputWidth) / 2;
    }
    this.outputCtx!.drawImage(
      data,
      xoffset,
      yoffset,
      inputWidth,
      inputHeight,
      0,
      0,
      this.output!.width,
      this.output!.height,
    );
  }

  private async addBlurToBackground() {
    let blurValue = '15px';
    if (this.input!.width <= 160) {
      blurValue = '5px';
    } else if (this.input!.width <= 320) {
      blurValue = '10px';
    } else if (this.input!.width <= 640) {
      blurValue = '15px';
    } else if (this.input!.width <= 960) {
      blurValue = '20px';
    } else if (this.input!.width <= 1280) {
      blurValue = '25px';
    } else if (this.input!.width <= 1920) {
      blurValue = '30px';
    }

    this.outputCtx!.filter = `blur(${blurValue})`;
    this.outputCtx!.drawImage(this.input!, 0, 0, this.output!.width, this.output!.height);
  }

  private initSharpenFilter(): any {
    this.filters.tmpCanvas = document.createElement('canvas');
    this.filters.tmpCtx = this.filters.tmpCanvas.getContext('2d');

    this.filters.createImageData = (w: number, h: number) => {
      return this.filters.tmpCtx.createImageData(w, h);
    };

    this.filters.convolute = (pixels: ImageData, weights = [0, -1, 0, -1, 5, -1, 0, -1, 0], opaque: boolean) => {
      const side = Math.round(Math.sqrt(weights.length));

      const halfSide = Math.floor(side / 2);
      const src = pixels.data;
      const sw = pixels.width;
      const sh = pixels.height;
      // pad output by the convolution matrix
      const w = sw;
      const h = sh;
      const output = this.filters.createImageData(w, h);
      const dst = output.data;
      // go through the destination image pixels
      const alphaFac = opaque ? 1 : 0;
      for (let y = 0; y < h; y = y + 1) {
        for (let x = 0; x < w; x = x + 1) {
          const dstOff = (y * w + x) * 4;

          if (src[dstOff + 3] === 0) {
            continue;
          } else if (x < w && y < h) {
            const sy = y;
            const sx = x;

            // calculate the weighed sum of the source image pixels that
            // fall under the convolution matrix
            let r = 0,
              g = 0,
              b = 0,
              a = 0;
            for (let cy = 0; cy < side; cy++) {
              for (let cx = 0; cx < side; cx++) {
                const scy = sy + cy - halfSide;
                const scx = sx + cx - halfSide;
                if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
                  const srcOff = (scy * sw + scx) * 4;
                  const wt = weights[cy * side + cx];
                  r += src[srcOff] * wt;
                  g += src[srcOff + 1] * wt;
                  b += src[srcOff + 2] * wt;
                  a += src[srcOff + 3] * wt;
                }
              }
            }
            dst[dstOff] = r;
            dst[dstOff + 1] = g;
            dst[dstOff + 2] = b;
            dst[dstOff + 3] = a + alphaFac * (255 - a);
          }
        }
      }
      return output;
    };
  }
}

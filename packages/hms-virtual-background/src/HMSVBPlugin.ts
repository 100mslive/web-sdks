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
// const DEFAULT_DELAY = 33;

// const minVideoWidthForSharpening = 214;
// const maxVideoWidthForSharpening = 855;
// const minVideoHeightForSharpening = 120;
// const maxVideoHeightForSharpening = 720;

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
  //   tfLite: any;
  //   tfLitePromise: any;
  segmenter!: bodySegmentation.BodySegmenter;
  modelName: string;

  input: HTMLCanvasElement | null;
  output: HTMLCanvasElement | null;
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
    // this.tfLite = null;
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
      this.outputCtx!.fillStyle = `rgb(0, 0, 0)`;
      this.outputCtx!.fillRect(0, 0, this.output!.width, this.output!.height);
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

    if (typeof this.background === 'string') {
      return;
    }

    const segmentationConfig = { flipHorizontal: true };
    const people = await this.segmenter.segmentPeople(input, segmentationConfig);
    const foregroundColor = { r: 0, g: 0, b: 0, a: 0 };
    const backgroundColor = { r: 0, g: 0, b: 0, a: 255 };
    const mask = await bodySegmentation.toBinaryMask(people, foregroundColor, backgroundColor, false);
    output.width = input.width;
    output.height = input.height;
    const ctx = output.getContext('2d');
    ctx!.imageSmoothingEnabled = true;
    ctx!.imageSmoothingQuality = 'high';
    ctx!.drawImage(this.background, 0, 0, input.width, input.height);
    this.personMaskCanvas.width = mask.width;
    this.personMaskCanvas.height = mask.height;
    this.personMaskCtx!.putImageData(mask, 0, 0);
    ctx!.globalCompositeOperation = 'destination-atop';
    ctx!.drawImage(this.personMaskCanvas, 0, 0, mask.width, mask.height, 0, 0, input.width, input.height);
    ctx!.globalCompositeOperation = 'destination-over';
    // ctx!.filter = 'none';
    // Draw the foreground
    ctx!.drawImage(input, 0, 0, mask.width, mask.height, 0, 0, input.width, input.height);

    // Draw background
    // ctx!.globalCompositeOperation = 'exclusion';

    /*
    console.error('skipProcessing', skipProcessing, people[0]); */
    /* if (ctx!.canvas.width !== input.width) {
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
    } */

    // const process = async () => {
    //   await this.runSegmentation(skipProcessing);
    // };

    /* if ((this.background === 'none' && !this.isVirtualBackground) || skipProcessing) {
      this.outputCtx!.globalCompositeOperation = 'copy';
      this.outputCtx!.filter = 'none';
      this.outputCtx!.drawImage(input, 0, 0, input.width, input.height);
    } else {
      //   process();
    } */
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

  /* private resizeInputData() {
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

  */
}

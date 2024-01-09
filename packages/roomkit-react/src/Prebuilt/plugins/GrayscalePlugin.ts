import { HMSPluginSupportResult, HMSVideoPlugin, HMSVideoPluginType } from '@100mslive/react-sdk';

export class GrayscalePlugin implements HMSVideoPlugin {
  isSupported(): boolean {
    return true;
  }
  getName() {
    return 'grayscale-plugin';
  }

  checkSupport() {
    return { isSupported: true } as HMSPluginSupportResult;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async init() {}

  getPluginType() {
    return HMSVideoPluginType.TRANSFORM;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  stop() {}

  /**
   * @param input {HTMLCanvasElement}
   * @param output {HTMLCanvasElement}
   */
  processVideoFrame(input: HTMLCanvasElement, output: HTMLCanvasElement) {
    const width = input.width;
    const height = input.height;
    output.width = width;
    output.height = height;
    const inputCtx = input.getContext('2d');
    const outputCtx = output.getContext('2d');
    const imgData = inputCtx?.getImageData(0, 0, width, height);
    if (imgData) {
      const pixels = imgData?.data;
      for (let i = 0; i < pixels.length; i += 4) {
        const red = pixels[i];
        const green = pixels[i + 1];
        const blue = pixels[i + 2];
        // https://en.wikipedia.org/wiki/Grayscale#Luma_coding_in_video_systems
        const lightness = Math.floor(red * 0.299 + green * 0.587 + blue * 0.114);
        pixels[i] = pixels[i + 1] = pixels[i + 2] = lightness;
      }
      outputCtx?.putImageData(imgData, 0, 0);
    }
  }
}

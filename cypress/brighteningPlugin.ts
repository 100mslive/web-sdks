import { HMSVideoPluginType } from '@100mslive/hms-video-store';
export class brighteningPlugin {
  private brightnessMul: number;
  private name;

  constructor(brightnessMul = 1, name = 'brightening-plugin') {
    this.brightnessMul = brightnessMul;
    this.name = name;
  }

  getName() {
    return this.name;
  }

  checkSupport() {
    return { isSupported: true };
  }

  isSupported() {
    return true;
  }

  async init() {}

  getPluginType() {
    return HMSVideoPluginType.TRANSFORM;
  }

  stop() {}

  /**
   * @param input {HTMLCanvasElement}
   * @param output {HTMLCanvasElement}
   */
  processVideoFrame(input, output) {
    const width = input.width;
    const height = input.height;
    output.width = width;
    output.height = height;
    const inputCtx = input.getContext('2d');
    const outputCtx = output.getContext('2d');
    const imgData = inputCtx.getImageData(0, 0, width, height);
    const pixels = imgData.data;

    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = pixels[i] * this.brightnessMul;
      pixels[i + 1] = pixels[i + 1] * this.brightnessMul;
      pixels[i + 2] = pixels[i + 2] * this.brightnessMul;
    }
    outputCtx.putImageData(imgData, 0, 0);
  }
}

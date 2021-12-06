import { HMSVideoPluginType } from "@100mslive/hms-video";
export class GrayscalePlugin {
  getName() {
    return "grayscale-plugin";
  }

  isSupported() {
    return true;
  }

  async init() {}

  getPluginType() {
    return HMSVideoPluginType.TRANSFORM;
  }

  stop() {}

  cropCanvas = (canvas, x, y, width, height) => {
    // create a temp canvas
    const newCanvas = document.createElement("canvas");
    // set its dimensions
    newCanvas.width = width;
    newCanvas.height = height;
    // draw the canvas in the new resized temp canvas
    newCanvas
      .getContext("2d")
      .drawImage(canvas, x, y, width, height, 0, 0, width, height);
    return newCanvas;
  };

  /**
   * @param input {HTMLCanvasElement}
   * @param output {HTMLCanvasElement}
   */
  processVideoFrame(input, output) {
    const width = input.width;
    const height = input.height;
    output.width = width;
    output.height = height;
    const inputCtx = input.getContext("2d");
    const outputCtx = output.getContext("2d");
    const imgData = inputCtx.getImageData(0, 0, width, height);
    const pixels = imgData.data;

    for (let i = 0; i < pixels.length; i += 4) {
      const red = pixels[i];
      const green = pixels[i + 1];
      const blue = pixels[i + 2];
      // https://en.wikipedia.org/wiki/Grayscale#Luma_coding_in_video_systems
      const lightness = Math.floor(red * 0.299 + green * 0.587 + blue * 0.114);
      pixels[i] = pixels[i + 1] = pixels[i + 2] = lightness;
    }
    outputCtx.putImageData(imgData, 0, 0);
  }
}

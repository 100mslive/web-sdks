/* eslint-disable complexity */
export function makeGaussKernel(sigma: number) {
  const GAUSSKERN = 6.0;
  const dim = Math.floor(Math.max(3.0, GAUSSKERN * sigma));
  const sqrtSigmaPi2 = Math.sqrt(Math.PI * 2.0) * sigma;
  const s2 = 2.0 * sigma * sigma;
  let sum = 0.0;

  const kernel = new Float32Array(dim - Number(!(dim & 1))); // Make it odd number
  const half = Math.floor(kernel.length / 2);
  for (let j = 0, i = -half; j < kernel.length; i++, j++) {
    kernel[j] = Math.exp(-(i * i) / s2) / sqrtSigmaPi2;
    sum += kernel[j];
  }
  // Normalize the gaussian kernel to prevent image darkening/brightening
  for (let i = 0; i < dim; i++) {
    kernel[i] /= sum;
  }
  return kernel;
}

/**
 * Internal helper method
 * @param pixels - the Canvas pixles
 * @param kernel - the Gaussian blur kernel
 * @param ch - the color channel to apply the blur on
 * @param gray - flag to show RGB or Grayscale image
 */
export function gauss_internal(pixels: ImageData, kernel: Float32Array, ch: number, gray = false) {
  const data = pixels.data;
  const w = pixels.width;
  const h = pixels.height;
  const buff = new Uint8Array(w * h);
  const mk = Math.floor(kernel.length / 2);
  const kl = kernel.length;

  // First step process columns
  for (let j = 0, hw = 0; j < h; j++, hw += w) {
    for (let i = 0; i < w; i++) {
      let sum = 0;
      for (let k = 0; k < kl; k++) {
        let col = i + (k - mk);
        col = col < 0 ? 0 : col >= w ? w - 1 : col;
        sum += data[(hw + col) * 4 + ch] * kernel[k];
      }
      buff[hw + i] = sum;
    }
  }

  // Second step process rows
  for (let j = 0, offset = 0; j < h; j++, offset += w) {
    for (let i = 0; i < w; i++) {
      let sum = 0;
      for (let k = 0; k < kl; k++) {
        let row = j + (k - mk);
        row = row < 0 ? 0 : row >= h ? h - 1 : row;
        sum += buff[row * w + i] * kernel[k];
      }
      const off = (j * w + i) * 4;
      !gray ? (data[off + ch] = sum) : (data[off] = data[off + 1] = data[off + 2] = sum);
    }
  }
}

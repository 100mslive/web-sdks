function saturate(src: Uint8ClampedArray, w: number, h: number, sv: number) {
  let pos, i, j, offset;

  const lumR = (1 - sv) * 0.3086;
  const lumG = (1 - sv) * 0.6094;
  const lumB = (1 - sv) * 0.082;

  let r, g, b;

  const shiftW = w << 2;

  for (j = 0; j < h; j++) {
    offset = j * shiftW;

    for (i = 0; i < w; i++) {
      pos = offset + (i << 2);

      r = src[pos];
      g = src[pos + 1];
      b = src[pos + 2];

      src[pos] = (lumR + sv) * r + lumG * g + lumB * b;

      src[pos + 1] = lumR * r + (lumG + sv) * g + lumB * b;

      src[pos + 2] = lumR * r + lumG * g + (lumB + sv) * b;
    }
  }
}

function boxBlur(src: Uint8ClampedArray, w: number, h: number, r: number, sv: number) {
  const tmp = new Uint8ClampedArray(w * h * 4);
  blurRight(src, tmp, w, h, r);
  blurDown(tmp, src, w, h, r);
  blurLeft(src, tmp, w, h, r);
  blurUp(tmp, src, w, h, r);
  sv !== undefined && sv !== 1 && saturate(src, w, h, sv);
}

function blurRight(src: Uint8ClampedArray, dest: Uint8ClampedArray, w: number, h: number, r: number) {
  let i, j, offset, pos, posR;

  const shiftR = r << 2;
  const shiftW = w << 2;

  let weightR, weightG, weightB, weightA;

  for (j = 0; j < h; j++) {
    weightR = 0;
    weightG = 0;
    weightB = 0;
    weightA = 0;

    offset = j * shiftW;

    for (i = 0; i < r; i++) {
      pos = offset + (i << 2);

      weightR += src[pos];
      weightG += src[pos + 1];
      weightB += src[pos + 2];
      weightA += src[pos + 3];

      dest[pos] = (weightR / (i + 1)) | 0;
      dest[pos + 1] = (weightG / (i + 1)) | 0;
      dest[pos + 2] = (weightB / (i + 1)) | 0;
      dest[pos + 3] = (weightA / (i + 1)) | 0;
    }

    for (; i < w; i++) {
      pos = offset + (i << 2);
      posR = pos - shiftR;

      dest[pos] = (weightR / r) | 0;
      dest[pos + 1] = (weightG / r) | 0;
      dest[pos + 2] = (weightB / r) | 0;
      dest[pos + 3] = (weightA / r) | 0;

      weightR += src[pos] - src[posR];
      weightG += src[pos + 1] - src[posR + 1];
      weightB += src[pos + 2] - src[posR + 2];
      weightA += src[pos + 3] - src[posR + 3];
    }
  }
}

function blurLeft(src: Uint8ClampedArray, dest: Uint8ClampedArray, w: number, h: number, r: number) {
  let i, j, offset, pos, posR;

  const shiftR = r << 2;
  const shiftW = w << 2;

  let weightR, weightG, weightB, weightA;

  for (j = 0; j < h; j++) {
    weightR = 0;
    weightG = 0;
    weightB = 0;
    weightA = 0;

    offset = j * shiftW;

    for (i = w - 1; i >= w - r; i--) {
      pos = offset + (i << 2);

      weightR += src[pos];
      weightG += src[pos + 1];
      weightB += src[pos + 2];
      weightA += src[pos + 3];

      dest[pos] = (weightR / (w - i)) | 0;
      dest[pos + 1] = (weightG / (w - i)) | 0;
      dest[pos + 2] = (weightB / (w - i)) | 0;
      dest[pos + 3] = (weightA / (w - i)) | 0;
    }

    for (; i >= 0; i--) {
      pos = offset + (i << 2);
      posR = pos + shiftR;

      dest[pos] = (weightR / r) | 0;
      dest[pos + 1] = (weightG / r) | 0;
      dest[pos + 2] = (weightB / r) | 0;
      dest[pos + 3] = (weightA / r) | 0;

      weightR += src[pos] - src[posR];
      weightG += src[pos + 1] - src[posR + 1];
      weightB += src[pos + 2] - src[posR + 2];
      weightA += src[pos + 3] - src[posR + 3];
    }
  }
}

function blurDown(src: Uint8ClampedArray, dest: Uint8ClampedArray, w: number, h: number, r: number) {
  let i, j, offset, pos, posR;

  const shiftW = w << 2;

  const offsetR = shiftW * r;

  let weightR, weightG, weightB, weightA;

  for (i = 0; i < w; i++) {
    weightR = 0;
    weightG = 0;
    weightB = 0;
    weightA = 0;

    offset = i << 2;

    for (j = 0; j < r; j++) {
      pos = offset + j * shiftW;

      weightR += src[pos];
      weightG += src[pos + 1];
      weightB += src[pos + 2];
      weightA += src[pos + 3];

      dest[pos] = (weightR / (j + 1)) | 0;
      dest[pos + 1] = (weightG / (j + 1)) | 0;
      dest[pos + 2] = (weightB / (j + 1)) | 0;
      dest[pos + 3] = (weightA / (j + 1)) | 0;
    }

    for (; j < h; j++) {
      pos = offset + j * shiftW;
      posR = pos - offsetR;

      dest[pos] = (weightR / r) | 0;
      dest[pos + 1] = (weightG / r) | 0;
      dest[pos + 2] = (weightB / r) | 0;
      dest[pos + 3] = (weightA / r) | 0;

      weightR += src[pos] - src[posR];
      weightG += src[pos + 1] - src[posR + 1];
      weightB += src[pos + 2] - src[posR + 2];
      weightA += src[pos + 3] - src[posR + 3];
    }
  }
}

function blurUp(src: Uint8ClampedArray, dest: Uint8ClampedArray, w: number, h: number, r: number) {
  let i, j, offset, pos, posR;

  const shiftW = w << 2;

  const offsetR = shiftW * r;

  let weightR, weightG, weightB, weightA;

  for (i = 0; i < w; i++) {
    weightR = 0;
    weightG = 0;
    weightB = 0;
    weightA = 0;

    offset = i << 2;

    for (j = h - 1; j >= h - r; j--) {
      pos = offset + j * shiftW;

      weightR += src[pos];
      weightG += src[pos + 1];
      weightB += src[pos + 2];
      weightA += src[pos + 3];

      dest[pos] = (weightR / (h - j)) | 0;
      dest[pos + 1] = (weightG / (h - j)) | 0;
      dest[pos + 2] = (weightB / (h - j)) | 0;
      dest[pos + 3] = (weightA / (h - j)) | 0;
    }

    for (; j >= 0; j--) {
      pos = offset + j * shiftW;
      posR = pos + offsetR;

      dest[pos] = (weightR / r) | 0;
      dest[pos + 1] = (weightG / r) | 0;
      dest[pos + 2] = (weightB / r) | 0;
      dest[pos + 3] = (weightA / r) | 0;

      weightR += src[pos] - src[posR];
      weightG += src[pos + 1] - src[posR + 1];
      weightB += src[pos + 2] - src[posR + 2];
      weightA += src[pos + 3] - src[posR + 3];
    }
  }
}

export function blurRect(ctx: CanvasRenderingContext2D, r: number, sv: number) {
  const canvas = ctx.canvas;

  const srcW = canvas.width | 0;
  const srcH = canvas.height | 0;

  const srcX = 0;
  const srcY = 0;

  r = (r | 0) * 32;
  r = Math.min(Math.max(r, 32), 256);

  const resizeFactor = Math.max(0, (Math.log(r) / Math.log(2) - 3) | 0);
  const radius = r >>> resizeFactor;

  const resizeWidth = canvas.width >>> resizeFactor;
  const resizeHeight = canvas.height >>> resizeFactor;
  let blurCanvas;
  if (typeof OffscreenCanvas !== 'undefined') {
    blurCanvas = new OffscreenCanvas(canvas.width, canvas.height);
  } else {
    blurCanvas = document.createElement('canvas');
    blurCanvas.width = canvas.width;
    blurCanvas.height = canvas.height;
  }
  const blurCtx = blurCanvas.getContext('2d');
  if (!blurCtx) {
    return;
  }

  blurCtx.drawImage(canvas, 0, 0, resizeWidth, resizeHeight);
  const imageData = blurCtx.getImageData(0, 0, resizeWidth, resizeHeight);

  boxBlur(imageData.data, resizeWidth, resizeHeight, radius, sv);

  blurCtx.putImageData(imageData, 0, 0);

  blurCtx.drawImage(blurCanvas, 0, 0, resizeWidth, resizeHeight, 0, 0, canvas.width, canvas.height);

  ctx.drawImage(blurCanvas, srcX, srcY, srcW, srcH, srcX, srcY, srcW, srcH);

  return ctx;
}

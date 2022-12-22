let CANVAS_FILL_COLOR;
let CANVAS_STROKE_COLOR;

function setPIPCanvasColors() {
  if (!CANVAS_FILL_COLOR) {
    CANVAS_FILL_COLOR = window
      .getComputedStyle(document.documentElement)
      .getPropertyValue("--hms-ui-colors-surfaceLight");
  }
  if (!CANVAS_STROKE_COLOR) {
    CANVAS_STROKE_COLOR = window
      .getComputedStyle(document.documentElement)
      .getPropertyValue("--hms-ui-colors-borderLight");
  }
}

export function resetPIPCanvasColors() {
  CANVAS_FILL_COLOR = "";
  CANVAS_STROKE_COLOR = "";
}
/**
 * no tile - blank canvas, black image
 * 1 tile - takes full space on canvas
 * 2 tile - stack two video adjacent to each other
 * 3 tile - two rows first row has two tile second row has one tile centered.
 * 4 tiles - two rows two columns - all equal size
 * All videos will respect their aspect ratios.
 */
export function drawVideoElementsOnCanvas(videoElements, canvas) {
  let videoTiles = videoElements.filter(
    videoElement => videoElement.srcObject !== null
  );

  const ctx = canvas.getContext("2d");
  setPIPCanvasColors();
  ctx.fillStyle = CANVAS_FILL_COLOR;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (videoTiles.length === 0) {
    // no tile to render, render black image
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }

  fillGridTiles(videoTiles.slice(0, 4), ctx, canvas);
}

// this is to send some data for stream and resolve video element's play for a
// video element rendering this canvas' capture stream
export function dummyChangeInCanvas(canvas) {
  const ctx = canvas.getContext("2d");
  setPIPCanvasColors();
  ctx.fillStyle = CANVAS_FILL_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/**
 * Imagine the canvas as a grid with passed in number of rows and columns. Go
 * over the tiles in the grid in order while drawing the videoElements upon them.
 */
function fillGridTiles(videoElements, ctx, canvas) {
  const offset = 8;
  canvas.width = 480;
  canvas.height = 320;

  ctx.fillStyle = CANVAS_FILL_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (videoElements.length > 0) {
    ctx.strokeStyle = CANVAS_STROKE_COLOR;
    ctx.lineWidth = offset;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
  }

  if (videoElements.length === 1) {
    const video = videoElements[0];
    const { width, height } = getRenderDimensions(
      video,
      canvas.width - offset,
      canvas.height - offset
    );
    const xOffset = (canvas.width - width) / 2;
    const yOffset = (canvas.height - height) / 2;
    ctx.drawImage(video, xOffset, yOffset, width, height);
  }

  if (videoElements.length === 2) {
    videoElements.forEach((video, index) => {
      const { width, height } = getRenderDimensions(
        video,
        canvas.width / 2 - offset,
        canvas.height - offset
      );
      const xOffset =
        (canvas.width / 2 - width) / 2 + (canvas.width / 2) * index;
      const yOffset = (canvas.height - height) / 2;

      ctx.drawImage(video, xOffset, yOffset, width, height);

      if (index === 0) {
        const path = new Path2D();
        path.moveTo(canvas.width / 2, 0);
        path.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke(path);
      }
    });
  }

  if (videoElements.length === 3) {
    videoElements.forEach((video, index) => {
      const { width, height } = getRenderDimensions(
        video,
        canvas.width / 2 - offset,
        canvas.height / 2 - offset
      );
      const xOffset =
        index < 2
          ? (canvas.width / 2 - width) / 2 + (canvas.width / 2) * index
          : canvas.width / 2 - width / 2;
      const yOffset =
        (index < 2 ? 0 : canvas.height / 2) + (canvas.height / 2 - height) / 2;

      ctx.drawImage(video, xOffset, yOffset, width, height);
      if (index === 0) {
        const path = new Path2D();
        path.moveTo(canvas.width / 2, 0);
        path.lineTo(canvas.width / 2, canvas.height / 2);
        ctx.stroke(path);
        path.moveTo(0, canvas.height / 2);
        path.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke(path);
      }
    });
  }
  if (videoElements.length === 4) {
    videoElements.forEach((video, index) => {
      const { width, height } = getRenderDimensions(
        video,
        canvas.width / 2 - offset,
        canvas.height / 2 - offset
      );
      const xOffset =
        (canvas.width / 2 - width) / 2 +
        (index < 2
          ? (canvas.width / 2) * index
          : (canvas.width / 2) * (3 - index));
      const yOffset =
        (index < 2 ? 0 : canvas.height / 2) + (canvas.height / 2 - height) / 2;

      ctx.drawImage(video, xOffset, yOffset, width, height);
      if (index === 0) {
        const path = new Path2D();
        path.moveTo(canvas.width / 2, 0);
        path.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke(path);
        path.moveTo(0, canvas.height / 2);
        path.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke(path);
      }
    });
  }
}

function getRenderDimensions(video, width, height) {
  let finalWidth = (video.videoWidth / video.videoHeight) * height;
  let finalHeight = height;

  if (finalWidth > width) {
    finalWidth = width;
    finalHeight = (video.videoHeight / video.videoWidth) * width;
  }
  return { width: finalWidth, height: finalHeight };
}

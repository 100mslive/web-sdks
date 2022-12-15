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
  ctx.fillStyle = "#303740";
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (videoTiles.length === 0) {
    // no tile to render, render black image
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }

  // const numRows = numberOfTiles <= 2 ? 1 : 2;
  // const numCols = Number(Math.ceil(numberOfTiles / numRows));
  fillGridTiles(videoTiles.slice(0, 4), ctx, canvas);
}

// this is to send some data for stream and resolve video element's play for a
// video element rendering this canvas' capture stream
export function dummyChangeInCanvas(canvas) {
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#000000";
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

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

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
        (canvas.width / 2 - width) / 2 +
        (index < 2 ? (canvas.width / 2) * index : canvas.width / 2 - width / 2);
      const yOffset =
        (index < 2 ? 0 : canvas.height / 2) + (canvas.height / 2 - height) / 2;

      ctx.drawImage(video, xOffset, yOffset, width, height);
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

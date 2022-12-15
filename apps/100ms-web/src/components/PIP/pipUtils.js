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
  ctx.fillStyle = "#303740";
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

  ctx.fillStyle = "#303740";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (videoElements.length === 1) {
    const video = videoElements[0];
    const { width, height } = getRenderDimensions(
      video,
      canvas.width - offset,
      canvas.height - offset
    );
    ctx.drawImage(
      video,
      canvas.width / 2 - width / 2 + offset,
      canvas.height / 2 - height / 2 + offset,
      width,
      height
    );
  }

  if (videoElements.length === 2) {
    videoElements.forEach((video, index) => {
      const { width, height } = getRenderDimensions(
        video,
        canvas.width / 2 - offset,
        canvas.height - offset
      );
      ctx.drawImage(
        video,
        (canvas.width / 2) * index + offset,
        canvas.height / 2 - height / 2 + offset,
        width,
        height
      );
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
        offset +
        (index < 2 ? (canvas.width / 2) * index : canvas.width / 2 - width / 2);
      const yOffset = offset + (index < 2 ? 0 : canvas.height / 2);
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
        offset +
        (index < 2
          ? (canvas.width / 2) * index
          : (canvas.width / 2) * (3 - index));
      const yOffset = offset + (index < 2 ? 0 : canvas.height / 2);
      ctx.drawImage(video, xOffset, yOffset, width, height);
    });
  }
}

function getRenderDimensions(video, renderTileWidth, renderTileHeight) {
  const originalAspectRatio = video.videoWidth / video.videoHeight;
  // the aspect ratio of the tile we are going to render the video
  const renderTileAspectRatio = renderTileHeight / renderTileWidth;
  let renderVideoWidth = renderTileWidth;
  let renderVideoHeight = renderTileHeight;
  /**
   * Note: AspectRatio = width/height
   * therefore,
   * Width = aspectRatio * height;
   * height = width / aspectRatio.
   */
  if (originalAspectRatio > renderTileAspectRatio) {
    /**
     * if original aspect ratio is greater than the tile's aspect ratio,
     * that means, we have to either shrink the height of the render
     * tile or increase the width of the render tile to maintain the aspect ratio.
     * Since we can't increase the tile size without affecting the
     * size of the canvas itself, we are choosing to shrink
     * the height.
     */
    renderVideoHeight = renderTileWidth / originalAspectRatio;
  } else {
    /**
     * if the aspect ratio of original video is less than or equal
     * to the tile's aspect ratio, then to maintain aspect ratio, we have to
     * either shrink the width or increase the height. Since we
     * can't increase the tile height without affecting the canvas height,
     * we shrink the width.
     */
    renderVideoWidth = renderTileHeight * originalAspectRatio;
  }
  return { width: renderVideoWidth, height: renderVideoHeight };
}

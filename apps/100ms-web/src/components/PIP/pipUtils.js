/**
 * no tile - blank canvas, black image
 * 1 tile - takes full space on canvas
 * 2 tile - stack two video adjacent to each other
 * 3 tile - two rows first row has two tile second row has one tile centered.
 * 4 tiles - two rows two columns - all equal size
 * All videos will respect their aspect ratios.
 */
export function drawVideoElementsOnCanvas(videoElements, canvas) {
  let numberOfTiles = videoElements.filter(
    videoElement => videoElement.srcObject !== null
  ).length;

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#000000";
  let canvasWidth = canvas.width;
  let canvasHeight = canvas.height;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (numberOfTiles === 0) {
    // no tile to render, render black image
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    return;
  }

  const numRows = numberOfTiles <= 2 ? 1 : 2;
  const numCols = Number(Math.ceil(numberOfTiles / numRows));
  fillGridTiles(numRows, numCols, videoElements, ctx, canvas, numberOfTiles);
}

// this is to send some data for stream and resolve video element's play for a
// video element rendering this canvas' capture stream
export function dummyChangeInCanvas(canvas) {
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#000000";
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
}

/**
 * Imagine the canvas as a grid with passed in number of rows and columns. Go
 * over the tiles in the grid in order while drawing the videoElements upon them.
 */
function fillGridTiles(
  numRows,
  numCols,
  videoElements,
  ctx,
  canvas,
  numberOfTiles
) {
  let videoElementPos = 0;
  const renderTileWidth = 1280;
  const renderTileHeight = 720;

  canvas.width = renderTileWidth * numCols;
  canvas.height = renderTileHeight * numRows;

  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numCols; col++) {
      const video = videoElements[videoElementPos];
      const originalAspectRatio = video.videoWidth / video.videoHeight;
      const renderTileAspectRatio = renderTileHeight / renderTileWidth;
      let renderVideoWidth = renderTileWidth;
      let renderVideoHeight = renderTileHeight;
      if (originalAspectRatio > renderTileAspectRatio) {
        renderVideoHeight = renderTileWidth / originalAspectRatio;
      } else {
        renderVideoWidth = renderTileHeight * originalAspectRatio;
      }

      let tileStartX = col * renderTileWidth;
      let tileStartY = row * renderTileHeight;

      if (video && video.srcObject !== null) {
        const differenceInWidth = renderTileWidth - renderVideoWidth;
        const differenceInHeight = renderTileHeight - renderVideoHeight;
        let startXOffset = differenceInWidth / 2;
        const startYOffset = differenceInHeight / 2;

        /**
         * If the second column row has only one element,
         * align it to center.
         */
        if (row === 1 && numberOfTiles === 3) {
          const totalCanvasWidth = renderTileWidth * 2;
          startXOffset = (totalCanvasWidth - renderVideoWidth) / 2;
        }
        tileStartX = tileStartX + startXOffset;
        tileStartY = tileStartY + startYOffset;
        ctx.drawImage(
          video,
          tileStartX,
          tileStartY,
          renderVideoWidth,
          renderVideoHeight
        );
      }
      videoElementPos++;
    }
  }
}

/**
 * no tile - blank canvas, black image
 * 1 tile - takes full space on canvas
 * 2 tile - vertically equally split
 * 3 tile - two rows two columns - bottom right column is blank
 * 4 tiles - two rows two columns - all equal size
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
  } else if (numberOfTiles === 1) {
    // draw the video element on full canvas
    const video = videoElements[0];
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    /**
     * crop the video to canvas by finding the
     * difference between the video size and the
     * canvas size and then crop the video by half
     * that difference on each side.
     */
    const differenceInWidth = videoWidth - canvasWidth;
    const differenceInHeight = videoHeight - canvasHeight;
    const sX = differenceInWidth / 2;
    const sY = differenceInHeight / 2;
    ctx.drawImage(
      video,
      sX,
      sY,
      canvasWidth,
      canvasHeight,
      0,
      0,
      canvasWidth,
      canvasHeight
    );
    return;
  } else if (numberOfTiles === 2) {
    // for two tiles, draw them as one over other to preserve aspect ratio.
    const videoOne = videoElements[0];
    const videoTwo = videoElements[1];
    /**
     * the canvas are of the same width as the videos and twice their height
     * because we are stacking them one over the other.
     */
    canvas.width = videoOne.videoWidth;
    canvas.height = videoOne.videoHeight + videoTwo.videoHeight;
    ctx.drawImage(videoOne, 0, 0, videoOne.videoWidth, videoOne.videoHeight);
    ctx.drawImage(
      videoTwo,
      0,
      videoOne.videoHeight,
      videoTwo.videoWidth,
      videoTwo.videoHeight
    );
    return;
  }
  // if there are more than 2 videos to show, split into two rows
  const numRows = numberOfTiles <= 2 ? 1 : 2;
  const numCols = Number(Math.ceil(numberOfTiles / numRows));
  const tileHeight = canvasHeight / numRows;
  const tileWidth = canvasWidth / numCols;

  fillGridTiles(numRows, numCols, tileHeight, tileWidth, videoElements, ctx);
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
  tileHeight,
  tileWidth,
  videoElements,
  ctx
) {
  let videoElementPos = 0;
  for (let row = 0; row < numRows; row++) {
    const startY = row * tileHeight;
    for (let col = 0; col < numCols; col++) {
      const startX = col * tileWidth;
      const video = videoElements[videoElementPos];
      if (!video || video.srcObject === null) {
        ctx.fillRect(startX, startY, tileWidth, tileHeight); // draw black tile
      } else {
        ctx.drawImage(video, startX, startY, tileWidth, tileHeight);
      }
      videoElementPos++;
    }
  }
}

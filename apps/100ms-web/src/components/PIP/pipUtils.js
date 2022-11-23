/**
 * no tile - blank canvas, black image
 * 1 tile - takes full space on canvas
 * 2 tile - stack one video on top of the other
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
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return;
  } else if (numberOfTiles === 2) {
    // for two tiles, draw them as one over other to preserve aspect ratio.
    const videoOne = videoElements[0];
    const videoTwo = videoElements[1];
    /**
     * WebRTC Ramps up the video resolution than giving direct resolution
     * immediately, so it takes a while for videos to reach full resolution,
     * thus causing skewed aspect ratios/stretched videos. To circumvent that,
     * we try to resize the canvas' dimensions by taking the biggest video
     * of both and use that as a dimension for the canvas.
     */
    canvas.width = Math.max(videoOne.videoWidth, videoTwo.videoWidth);
    canvas.height = Math.max(videoOne.videoHeight, videoTwo.videoHeight) * 2;

    ctx.drawImage(videoOne, 0, 0, videoOne.videoWidth, videoOne.videoHeight);
    ctx.drawImage(
      videoTwo,
      0,
      videoOne.videoHeight,
      videoOne.videoWidth,
      videoOne.videoHeight
    );
    return;
  }
  // if there are more than 2 videos to show, split into two rows
  const numRows = numberOfTiles <= 2 ? 1 : 2;
  const numCols = Number(Math.ceil(numberOfTiles / numRows));
  const tileHeight = Math.max(
    ...videoElements.map(videoEl => videoEl.videoHeight)
  );
  const tileWidth = Math.max(
    ...videoElements.map(videoEl => videoEl.videoWidth)
  );
  fillGridTiles(
    numRows,
    numCols,
    tileHeight,
    tileWidth,
    videoElements,
    ctx,
    canvas
  );
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
  ctx,
  canvas
) {
  let videoElementPos = 0;
  canvas.width = tileWidth * numCols;
  canvas.height = tileHeight * numRows;
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

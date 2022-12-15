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
  let videoElementPos = 0;
  const offset = 6;
  canvas.width = 640;
  canvas.height = 320;

  ctx.fillStyle = "#303740";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (videoElements.length === 1) {
    ctx.drawImage(
      videoElements[videoElementPos],
      offset,
      offset,
      canvas.width - offset,
      canvas.height - offset
    );
  }

  if (videoElements.length === 2) {
    ctx.drawImage(
      videoElements[videoElementPos++],
      canvas.width / 4 + offset,
      offset,
      canvas.width / 2 - offset,
      canvas.height / 2 - offset
    );
    ctx.drawImage(
      videoElements[videoElementPos],
      canvas.width / 4 + offset,
      canvas.height / 2 + offset,
      canvas.width / 2 - offset,
      canvas.height / 2 - offset
    );
  }

  if (videoElements.length === 3) {
    ctx.drawImage(
      videoElements[videoElementPos++],
      offset,
      offset,
      canvas.width / 2 - offset,
      canvas.height / 2 - offset
    );
    ctx.drawImage(
      videoElements[videoElementPos++],
      canvas.width / 2 + offset,
      offset,
      canvas.width / 2 - offset,
      canvas.height / 2 - offset
    );
    ctx.drawImage(
      videoElements[videoElementPos],
      canvas.width / 4 + offset,
      canvas.height / 2 + offset,
      canvas.width / 2 - offset,
      canvas.height / 2 - offset
    );
  }
  if (videoElements.length === 4) {
    ctx.drawImage(
      videoElements[videoElementPos++],
      offset,
      offset,
      canvas.width / 2 - offset,
      canvas.height / 2 - offset
    );
    ctx.drawImage(
      videoElements[videoElementPos++],
      canvas.width / 2 + offset,
      offset,
      canvas.width / 2 - offset,
      canvas.height / 2 - offset
    );
    ctx.drawImage(
      videoElements[videoElementPos++],
      offset,
      canvas.height / 2 + offset,
      canvas.width / 2 - offset,
      canvas.height / 2 - offset
    );
    ctx.drawImage(
      videoElements[videoElementPos],
      canvas.width / 2 + offset,
      canvas.height / 2 + offset,
      canvas.width / 2 - offset,
      canvas.height / 2 - offset
    );
  }
}

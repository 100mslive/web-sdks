// Static PIP canvas dimensions. Kept a little larger than the older video-only
// size (480x320) so an incoming chat bubble can overlay the bottom band without
// covering much of the (now bigger) video. The canvas is never resized at runtime.
export const PIP_CANVAS_WIDTH = 480;
export const PIP_CANVAS_HEIGHT = 360;

let CANVAS_FILL_COLOR;
let CANVAS_STROKE_COLOR;
let BUBBLE_FILL_COLOR;
let BUBBLE_TEXT_COLOR;

function setPIPCanvasColors() {
  if (!CANVAS_FILL_COLOR) {
    CANVAS_FILL_COLOR = window
      .getComputedStyle(document.documentElement)
      .getPropertyValue('--hms-ui-colors-surface_bright');
  }
  if (!CANVAS_STROKE_COLOR) {
    CANVAS_STROKE_COLOR = window
      .getComputedStyle(document.documentElement)
      .getPropertyValue('--hms-ui-colors-border_bright');
  }
  if (!BUBBLE_FILL_COLOR) {
    BUBBLE_FILL_COLOR = window
      .getComputedStyle(document.documentElement)
      .getPropertyValue('--hms-ui-colors-surface_default');
  }
  if (!BUBBLE_TEXT_COLOR) {
    BUBBLE_TEXT_COLOR = window
      .getComputedStyle(document.documentElement)
      .getPropertyValue('--hms-ui-colors-on_surface_high');
  }
}

export function resetPIPCanvasColors() {
  CANVAS_FILL_COLOR = '';
  CANVAS_STROKE_COLOR = '';
  BUBBLE_FILL_COLOR = '';
  BUBBLE_TEXT_COLOR = '';
}
/**
 * no tile - blank canvas, black image
 * 1 tile - takes full space on canvas
 * 2 tile - stack two video adjacent to each other
 * 3 tile - two rows first row has two tile second row has one tile centered.
 * 4 tiles - two rows two columns - all equal size
 * All videos will respect their aspect ratios.
 */
export function drawVideoElementsOnCanvas(videoElements, canvas, message) {
  let videoTiles = videoElements.filter(videoElement => videoElement.srcObject !== null);

  const ctx = canvas.getContext('2d');
  setPIPCanvasColors();
  ctx.fillStyle = CANVAS_FILL_COLOR;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (videoTiles.length === 0) {
    // no tile to render, render black image
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    fillGridTiles(videoTiles.slice(0, 4), ctx, canvas);
  }

  // Overlay the latest incoming chat message as a transient bubble. Drawn on top
  // of the video (the canvas is not resized) and sized to occupy only the bottom
  // band so it never covers much of the video.
  if (message && (message.senderName || message.text)) {
    drawMessageBubble(ctx, canvas, message);
  }
}

// this is to send some data for stream and resolve video element's play for a
// video element rendering this canvas' capture stream
export function dummyChangeInCanvas(canvas) {
  const ctx = canvas.getContext('2d');
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
  canvas.width = PIP_CANVAS_WIDTH;
  canvas.height = PIP_CANVAS_HEIGHT;

  ctx.fillStyle = CANVAS_FILL_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Show borders only when there is atleast one video
  if (videoElements.length > 0) {
    ctx.strokeStyle = CANVAS_STROKE_COLOR;
    ctx.lineWidth = offset / 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
  }

  if (videoElements.length === 1) {
    const video = videoElements[0];
    const { width, height } = getRenderDimensions(video, canvas.width - offset, canvas.height - offset);
    /**
     * The x and y offset are to center the video tile horizontally and vertically
     * width and height are the aspect ratio constrained video tile dimensions
     */
    const xOffset = (canvas.width - width) / 2;
    const yOffset = (canvas.height - height) / 2;
    ctx.drawImage(video, xOffset, yOffset, width, height);
  }

  if (videoElements.length === 2) {
    videoElements.forEach((video, index) => {
      const { width, height } = getRenderDimensions(
        video,
        canvas.width / 2 - offset, // This will be the max available width for each tile
        canvas.height - offset,
      );
      /**
       * (canvas.width / 2 - width) / 2 This is to center width wise within in the box
       * (canvas.width / 2) * index This is the start offset
       * for 1st element it is 0, for second it will be canvas.width/2 which starts from the center
       */
      const xOffset = (canvas.width / 2 - width) / 2 + (canvas.width / 2) * index;
      /**
       * (canvas.height - height) / 2 This is to center height wise
       */
      const yOffset = (canvas.height - height) / 2;

      ctx.drawImage(video, xOffset, yOffset, width, height);
    });
    /**
     * Draw a border between tiles
     */
    const path = new Path2D();
    path.moveTo(canvas.width / 2, 0);
    path.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke(path);
  }

  if (videoElements.length === 3) {
    videoElements.forEach((video, index) => {
      const { width, height } = getRenderDimensions(video, canvas.width / 2 - offset, canvas.height / 2 - offset);
      /**
       * for first two tiles, xOffset is similar to the 2 tiles calculation with only difference being the height. it is half now.
       */
      const xOffset =
        index < 2 ? (canvas.width / 2 - width) / 2 + (canvas.width / 2) * index : canvas.width / 2 - width / 2;
      const yOffset = (index < 2 ? 0 : canvas.height / 2) + (canvas.height / 2 - height) / 2;

      ctx.drawImage(video, xOffset, yOffset, width, height);
    });
    /**
     * Draw borders between tiles
     */
    const path = new Path2D();
    path.moveTo(canvas.width / 2, 0);
    path.lineTo(canvas.width / 2, canvas.height / 2);
    ctx.stroke(path);
    path.moveTo(0, canvas.height / 2);
    path.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke(path);
  }
  if (videoElements.length === 4) {
    videoElements.forEach((video, index) => {
      const { width, height } = getRenderDimensions(video, canvas.width / 2 - offset, canvas.height / 2 - offset);
      /**
       * Similar to two tiles repeat after 2 tiles
       * (canvas.width / 2 - width) / 2 is to center horizontally
       */
      const xOffset = (canvas.width / 2 - width) / 2 + (canvas.width / 2) * (index % 2);
      /**
       * Similar to two tiles with the yOffset being height/2 for the 3rd and 4th tiles
       * (canvas.height / 2 - height) / 2 is to center vertically
       */
      const yOffset = (index < 2 ? 0 : canvas.height / 2) + (canvas.height / 2 - height) / 2;

      ctx.drawImage(video, xOffset, yOffset, width, height);
    });
    /**
     * Draw borders between tiles
     */
    const path = new Path2D();
    path.moveTo(canvas.width / 2, 0);
    path.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke(path);
    path.moveTo(0, canvas.height / 2);
    path.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke(path);
  }
}

/**
 * Restrict the dimensions within the available dimension with aspect ratio
 * constraint applied
 * @param {HTMLVideoElement} video
 * @param {number} width
 * @param {number} height
 * @returns { width: number, height: number }
 */
function getRenderDimensions(video, width, height) {
  let finalWidth = (video.videoWidth / video.videoHeight) * height;
  let finalHeight = height;

  if (finalWidth > width) {
    finalWidth = width;
    finalHeight = (video.videoHeight / video.videoWidth) * width;
  }
  return { width: finalWidth, height: finalHeight };
}

// Sizes are in canvas pixels (canvas is 480x360). The browser upscales the PIP
// window well beyond that, so these are kept generous to stay legible after
// upscaling rather than rendering as a tiny strip.
const BUBBLE_MARGIN = 14;
const BUBBLE_PADDING_X = 16;
const BUBBLE_PADDING_Y = 14;
const BUBBLE_SENDER_LINE_HEIGHT = 22;
const BUBBLE_TEXT_LINE_HEIGHT = 24;
const BUBBLE_LINE_GAP = 4;
const BUBBLE_RADIUS = 12;
const BUBBLE_SENDER_FONT = '600 18px Inter, Arial, sans-serif';
const BUBBLE_TEXT_FONT = '400 19px Inter, Arial, sans-serif';

/**
 * Draw a translucent, bottom-anchored chat bubble showing the latest incoming
 * message (sender name + single, ellipsised line of text). Styled like the
 * in-app chat row but as a caption-style overlay so it reads over video.
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLCanvasElement} canvas
 * @param {{ senderName?: string, text?: string }} message
 */
function drawMessageBubble(ctx, canvas, message) {
  const bubbleWidth = canvas.width - BUBBLE_MARGIN * 2;
  // sender line + gap + one message line
  const bubbleHeight = BUBBLE_PADDING_Y * 2 + BUBBLE_SENDER_LINE_HEIGHT + BUBBLE_LINE_GAP + BUBBLE_TEXT_LINE_HEIGHT;
  const x = BUBBLE_MARGIN;
  const y = canvas.height - bubbleHeight - BUBBLE_MARGIN;
  const innerWidth = bubbleWidth - BUBBLE_PADDING_X * 2;

  ctx.save();

  // translucent rounded background so the video remains partially visible
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = BUBBLE_FILL_COLOR || CANVAS_FILL_COLOR;
  traceRoundedRect(ctx, x, y, bubbleWidth, bubbleHeight, BUBBLE_RADIUS);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;
  ctx.strokeStyle = CANVAS_STROKE_COLOR;
  traceRoundedRect(ctx, x, y, bubbleWidth, bubbleHeight, BUBBLE_RADIUS);
  ctx.stroke();

  const textColor = BUBBLE_TEXT_COLOR || '#ffffff';
  ctx.textBaseline = 'top';
  ctx.fillStyle = textColor;

  // sender name
  ctx.font = BUBBLE_SENDER_FONT;
  ctx.fillText(
    truncateToWidth(ctx, message.senderName || 'Anonymous', innerWidth),
    x + BUBBLE_PADDING_X,
    y + BUBBLE_PADDING_Y,
  );

  // message text (single line)
  ctx.font = BUBBLE_TEXT_FONT;
  ctx.globalAlpha = 0.9;
  ctx.fillText(
    truncateToWidth(ctx, message.text || '', innerWidth),
    x + BUBBLE_PADDING_X,
    y + BUBBLE_PADDING_Y + BUBBLE_SENDER_LINE_HEIGHT + BUBBLE_LINE_GAP,
  );

  ctx.restore();
}

/**
 * Trace a rounded-rectangle path (caller is responsible for fill/stroke).
 * Avoids relying on the not-universally-supported ctx.roundRect().
 */
function traceRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

/**
 * Truncate text with an ellipsis so it fits within maxWidth for the current ctx font.
 */
function truncateToWidth(ctx, text, maxWidth) {
  if (!text) {
    return '';
  }
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }
  const ellipsis = '…';
  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(truncated + ellipsis).width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + ellipsis;
}

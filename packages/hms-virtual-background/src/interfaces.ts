export type HMSBackgroundInput = HTMLImageElement | HTMLVideoElement | HTMLCanvasElement;
export enum HMSVirtualBackgroundTypes {
  BLUR = 'blur',
  NONE = 'none',
  GIF = 'gif',
  IMAGE = 'image',
  VIDEO = 'video',
  CANVAS = 'canvas',
}
export type HMSVirtualBackground = HMSVirtualBackgroundTypes.BLUR | HMSVirtualBackgroundTypes.NONE | HMSBackgroundInput;

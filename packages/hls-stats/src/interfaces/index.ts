import Hls from 'hls.js';

/**
 * this is a universal type to be passed for BaseAdapter.
 * Union more Types to this type as we support different libraries.
 */
export type HlsInstance = Hls;

export interface HlsPlayerStats {
  /** Estimated bandwidth in bytes. Could be used to show connection speed. */
  bandwidthEstimate?: number;
  /** The bitrate of the current level that is playing. */
  bitrate?: number;
  /** the amount of video that has been buffered. represented in videoTime */
  bufferHealth?: number;
  liveSyncPosition?: number;
  distanceFromLiveSync?: number;
  /** not implemented at the moment. */
  droppedFrames?: number;
  /** the m3u8 url of the current level that is being played */
  url?: string;
  /** the resolution of the level of the video that is being played */
  videoSize?: { height: number; width: number };
}

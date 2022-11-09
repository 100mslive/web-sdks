import Hls from 'hls.js';

/**
 * this is a universal type to be passed for BaseAdapter.
 * Union more Types to this type as we support different libraries.
 */
export type HlsInstance = Hls;

export interface HlsPlayerStats {
  /** Estimated bandwidth in bits/sec. Could be used to show connection speed. */
  bandwidthEstimate?: number;
  /** The bitrate of the current level that is playing. Given in bits/sec */
  bitrate?: number;
  /** the amount of video available in forward buffer. Given in ms */
  bufferedDuration?: number;
  /** how far is the current playback from live edge.*/
  distanceFromLive?: number;
  /** total Frames dropped since started watching the stream. */
  droppedFrames?: number;
  /** the m3u8 url of the current level that is being played */
  url?: string;
  /** the resolution of the level of the video that is being played */
  videoSize?: { height: number; width: number };
}

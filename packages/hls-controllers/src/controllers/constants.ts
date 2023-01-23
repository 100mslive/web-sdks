export const HLS_DEFAULT_ALLOWED_MAX_LATENCY_DELAY = 3;
export const IS_OPTIMIZED = true;

export enum HLSControllerEvents {
  HLS_TIMED_METADATA_LOADED = 'hls-timed-metadata',
  HLS_STREAM_NO_LONGER_LIVE = 'hls-stream-no-longer-live',

  HLS_PLAY = 'hls-play',
  HLS_PAUSE = 'hls-pause',
  HLS_CURRENT_TIME = 'hls-current-time',
  HLS_AUTOPLAY_BLOCKED = 'hls-autoplay-blocked',

  HLS_MANIFEST_LOADED = 'hls-manifest-loaded',
  HLS_LEVEL_UPDATED = 'hls-level-updated',
}

export const HLSControllerError = {};

export const HLS_DEFAULT_ALLOWED_MAX_LATENCY_DELAY = 3;
export const IS_OPTIMIZED = false;

export enum HMSHLSControllerEvents {
  HLS_TIMED_METADATA_LOADED = 'hls-timed-metadata',
  HLS_STREAM_NO_LONGER_LIVE = 'hls-stream-no-longer-live',

  HLS_CURRENT_TIME = 'hls-current-time',
  HLS_AUTOPLAY_BLOCKED = 'hls-autoplay-blocked',

  HLS_MANIFEST_LOADED = 'hls-manifest-loaded',
  HLS_LEVEL_UPDATED = 'hls-level-updated',

  HLS_ERROR = 'hls-error',
  HLS_PLAYBACK_STATE = 'hls-playback-state',
}

export enum HMSHLSExceptionEvents {
  MANIFEST_LOAD_ERROR = 'manifest-load-error',
  MANIFEST_PARSING_ERROR = 'manifest-parsing-error',
  LEVEL_LOAD_ERROR = 'level-load-error',

  MANIFEST_INCOMPATIBLE_CODECS_ERROR = 'manifest-incompatible-codecs-error',
  FRAG_DECRYPT_ERROR = 'frag-decrypt-error',
  BUFFER_INCOMPATIBLE_CODECS_ERROR = 'buffer-incompatible-codecs-error',

  VIDEO_ELEMENT_NOT_FOUND = 'video-element-not-found',
  HLS_URL_NOT_FOUND = 'hls-url-not-found',
  UNKNOWN_ERROR = 'unknown-error',
}

export enum HMSHLSPlaybackState {
  play,
  pause,
}

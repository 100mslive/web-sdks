export const HLS_DEFAULT_ALLOWED_MAX_LATENCY_DELAY = 5;

export enum HMSHLSPlayerEvents {
  TIMED_METADATA_LOADED = 'timed-metadata',
  SEEK_POS_BEHIND_LIVE_EDGE = 'seek-pos-behind-live-edge',

  CURRENT_TIME = 'current-time',
  AUTOPLAY_BLOCKED = 'autoplay-blocked',

  MANIFEST_LOADED = 'manifest-loaded',
  LAYER_UPDATED = 'layer-updated',
  CAPTION_ENABLED = 'caption-enabled',

  ERROR = 'error',
  PLAYBACK_STATE = 'playback-state',
  STATS = 'stats',
}

export enum HMSHLSExceptionEvents {
  MANIFEST_LOAD_ERROR = 'manifest-load-error',
  MANIFEST_PARSING_ERROR = 'manifest-parsing-error',
  LAYER_LOAD_ERROR = 'layer-load-error',

  MANIFEST_INCOMPATIBLE_CODECS_ERROR = 'manifest-incompatible-codecs-error',
  FRAG_DECRYPT_ERROR = 'frag-decrypt-error',
  BUFFER_INCOMPATIBLE_CODECS_ERROR = 'buffer-incompatible-codecs-error',

  VIDEO_ELEMENT_NOT_FOUND = 'video-element-not-found',
  HLS_AUTOPLAY_FAILED = 'hls-autoplay-failed',
  HLS_URL_NOT_FOUND = 'hls-url-not-found',
  HLS_ERROR = 'hls-error',
}

export enum HLSPlaybackState {
  playing,
  paused,
}

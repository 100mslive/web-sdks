export const RENEGOTIATION_CALLBACK_ID = 'renegotiation-callback-id';
export const API_DATA_CHANNEL = 'ion-sfu';
export const ANALYTICS_BUFFER_SIZE = 100;

/**
 * Maximum number of retries that transport-layer will try
 * before giving up on the connection and returning a failure
 *
 * Refer https://100ms.atlassian.net/browse/HMS-2369
 */
export const MAX_TRANSPORT_RETRIES = 5;
export const MAX_TRANSPORT_RETRY_DELAY = 60;

export const DEFAULT_SIGNAL_PING_TIMEOUT = 12000;
export const DEFAULT_SIGNAL_PING_INTERVAL = 1000;
export const PONG_RESPONSE_TIMES_SIZE = 5;

export const SUBSCRIBE_ICE_CONNECTION_CALLBACK_ID = 'SUBSCRIBE_ICE_CONNECTION_CALLBACK_ID';
export const SUBSCRIBE_TIMEOUT = 60000;

export const RTC_STATS_MONITOR_INTERVAL = 1000;

export const MAINTAIN_TRACK_HISTORY = false;

export const CLIENT_ANAYLTICS_PROD_ENDPOINT = 'https://event.100ms.live/v2/client/report';
export const CLIENT_ANAYLTICS_QA_ENDPOINT = 'https://event-nonprod.100ms.live/v2/client/report';
export const CLIENT_ANAYLTICS_STORAGE_LIMIT = 100;

export const HMSEvents = {
  DEVICE_CHANGE: 'device-change',
  LOCAL_AUDIO_ENABLED: 'local-audio-enabled',
  LOCAL_VIDEO_ENABLED: 'local-video-enabled',
  STATS_UPDATE: 'stats-update', // emitted by HMSWebrtcInternals
  RTC_STATS_UPDATE: 'rtc-stats-update', // emitted by RTCStatsMonitor
  TRACK_DEGRADED: 'track-degraded',
  TRACK_RESTORED: 'track-restored',
  TRACK_AUDIO_LEVEL_UPDATE: 'track-audio-level-update',
  LOCAL_AUDIO_SILENCE: 'local-audio-silence',
  ANALYTICS: 'analytics',
  AUDIO_PLUGIN_FAILED: 'audio-plugin-failed',
  POLICY_CHANGE: 'policy-change',
  LOCAL_ROLE_UPDATE: 'local-role-update',
  AUDIO_TRACK_UPDATE: 'audio-track-update',
  AUDIO_TRACK_ADDED: 'audio-track-added',
  AUDIO_TRACK_REMOVED: 'audio-track-removed',
  AUTOPLAY_ERROR: 'autoplay-error',
};

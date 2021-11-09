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
export const SIGNAL_PING_INTERVAL = 1000;

export const SUBSCRIBE_ICE_CONNECTION_CALLBACK_ID = 'SUBSCRIBE_ICE_CONNECTION_CALLBACK_ID';
export const SUBSCRIBE_TIMEOUT = 60000;

export const RTC_STATS_MONITOR_INTERVAL = 1000;

export const HMSEvents = {
  DEVICE_CHANGE: 'device-change',
  LOCAL_AUDIO_ENABLED: 'local-audio-enabled',
  LOCAL_VIDEO_ENABLED: 'local-video-enabled',
};

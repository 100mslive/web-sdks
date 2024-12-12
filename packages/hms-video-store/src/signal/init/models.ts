/**
 * Thresholds for the network quality scores in kbps.
 * ex: { 1: { low: 300, high: 400 }}
 */
export type ScoreMap = Record<
  number,
  {
    low: number;
    high?: number;
  }
>;

/**
 * Informantion necessary to test network quality. it provides a url to be
 * downloaded and timeout for the url download. And also the scores to be
 * assigned based on the downloaded data and time.
 */
export interface NetworkHealth {
  url: string;
  timeout: number;
  scoreMap: ScoreMap;
}
export interface InitConfig {
  readonly endpoint: string;
  readonly log_level: string;
  readonly policy: string;
  readonly rtcConfiguration: RTCConfiguration;
  readonly pingTimeout?: number;
  readonly config: {
    readonly enabledFlags?: Array<InitFlags>;
    readonly networkHealth: NetworkHealth;
    readonly publishStats?: {
      readonly maxSampleWindowSize: number;
      readonly maxSamplePushInterval: number;
    };
    readonly subscribeStats?: {
      readonly maxSampleWindowSize: number;
      readonly maxSamplePushInterval: number;
    };
    readonly dtlsStateTimeouts?: {
      readonly connecting: number;
      readonly failed: number;
    };
    readonly vb?: {
      readonly effectsKey: string;
    };
  };
}

export enum InitFlags {
  FLAG_SERVER_SUB_DEGRADATION = 'subscribeDegradation',
  FLAG_SERVER_SIMULCAST = 'simulcast',
  FLAG_NON_WEBRTC_DISABLE_OFFER = 'nonWebRTCDisableOffer',
  FLAG_PUBLISH_STATS = 'publishStats',
  FLAG_SUBSCRIBE_STATS = 'subscribeStats',
  FLAG_ON_DEMAND_TRACKS = 'onDemandTracks',
  // Don't unsubscribe for beam to prevent a/v sync in case of active speaker
  FLAG_DISABLE_VIDEO_TRACK_AUTO_UNSUBSCRIBE = 'disableVideoTrackAutoUnsubscribe',
  FLAG_WHITEBOARD_ENABLED = 'whiteboardEnabled',
  FLAG_EFFECTS_SDK_ENABLED = 'effectsSDKEnabled',
  FLAG_VB_ENABLED = 'vb',
  FLAG_HIPAA_ENABLED = 'hipaa',
  FLAG_NOISE_CANCELLATION = 'noiseCancellation',
  FLAG_SCALE_SCREENSHARE_BASED_ON_PIXELS = 'scaleScreenshareBasedOnPixels',
  FLAG_DISABLE_NONE_LAYER_REQUEST = 'disableNoneLayerRequest',
}

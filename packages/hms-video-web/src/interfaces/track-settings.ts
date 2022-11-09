export enum HMSVideoCodec {
  VP8 = 'vp8',
  VP9 = 'vp9',
  H264 = 'h264',
}

export enum HMSAudioCodec {
  OPUS = 'opus',
}

export interface HMSAudioTrackSettings {
  volume?: number;
  codec?: HMSAudioCodec;
  maxBitrate?: number;
  deviceId?: string;
  advanced?: Array<MediaTrackConstraintSet>;
}

export interface HMSVideoTrackSettings {
  width?: number;
  height?: number;
  codec?: HMSVideoCodec;
  maxFramerate?: number;
  maxBitrate?: number;
  deviceId?: string;
  advanced?: Array<MediaTrackConstraintSet>;
}

/**
 * Config to have control over screenshare being captured. Note that
 * not all fields are supported on all browsers. Even when they're supported
 * the fields acts as hints and the browser can override them.
 */
export interface HMSScreenShareConfig {
  /**
   * discard the video and only share audio track with others, useful
   * for sharing music.
   * @default false
   */
  audioOnly?: boolean;
  /**
   * do not give an option to share audio while screen sharing.
   * @default false
   */
  videoOnly?: boolean;
}

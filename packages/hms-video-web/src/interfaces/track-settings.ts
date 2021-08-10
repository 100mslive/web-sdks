export enum HMSVideoCodec {
  VP8 = 'vp8',
  VP9 = 'vp9',
  H264 = 'h264',
}

export enum HMSAudioCodec {
  OPUS = 'opus',
}

export interface HMSAudioTrackSettings {
  volume: number;
  codec: HMSAudioCodec;
  maxBitrate: number;
  deviceId: string;
  advanced: Array<MediaTrackConstraintSet>;
}

export interface HMSVideoTrackSettings {
  width: number;
  height: number;
  codec: HMSVideoCodec;
  maxFramerate: number;
  maxBitrate?: number;
  deviceId?: string;
  advanced: Array<MediaTrackConstraintSet>;
}

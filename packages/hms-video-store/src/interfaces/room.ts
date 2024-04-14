import { ServerError } from './internal';
import { HMSException } from '../error/HMSException';

export enum HMSRecordingState {
  NONE = 'none',
  INITIALISED = 'initialised',
  STARTED = 'started',
  PAUSED = 'paused',
  RESUMED = 'resumed',
  STOPPED = 'stopped',
  FAILED = 'failed',
}

export enum HMSStreamingState {
  NONE = 'none',
  INITIALISED = 'initialised',
  STARTED = 'started',
  STOPPED = 'stopped',
  FAILED = 'failed',
}

export interface HMSRoom {
  id: string;
  name?: string;
  sessionId?: string;
  joinedAt?: Date;
  startedAt?: Date;
  recording: HMSRecording;
  rtmp: HMSRTMP;
  hls: HMSHLS;
  peerCount?: number;
  templateId?: string;
  description?: string;
  max_size?: number;
  large_room_optimization?: boolean;
  /**
   * @alpha
   */
  isEffectsEnabled?: boolean;
  /**
   * @alpha
   */
  effectsKey?: string;
  isHipaaEnabled?: boolean;
  isNoiseCancellationEnabled?: boolean;
}

export interface HMSRecording {
  browser: HMSBrowserRecording;
  server: HMSSFURecording;
  hls: HMSHLSRecording;
}

export interface HMSBrowserRecording {
  running: boolean;
  startedAt?: Date;
  state?: HMSRecordingState;
  error?: HMSException;
}

export interface HMSSFURecording {
  running: boolean;
  startedAt?: Date;
  state?: HMSRecordingState;
  error?: HMSException;
}

export interface HMSHLSRecording {
  running: boolean;
  initialisedAt?: Date;
  startedAt?: Date;
  state?: HMSRecordingState;
  error?: ServerError;
  /**
   * if the final output is one file or one file per hls layer
   */
  singleFilePerLayer?: boolean;
  /**
   * if video on demand needs to be turned on, false by default
   */
  hlsVod?: boolean;
}

export interface HMSRTMP {
  running: boolean;
  /**
   * @alpha
   **/
  startedAt?: Date;
  state?: HMSStreamingState;
  error?: HMSException;
}

export interface HMSHLS {
  running: boolean;
  variants: Array<HLSVariant>;
  error?: HMSException;
}

export enum HLSPlaylistType {
  DVR = 'dvr',
  NO_DVR = 'no-dvr',
}

export enum HLSStreamType {
  REGULAR = 'regular',
  SCREEN = 'screen',
  COMPOSITE = 'composite',
}
export interface HLSVariant {
  url: string;
  playlist_type?: HLSPlaylistType;
  meetingURL?: string;
  metadata?: string;
  startedAt?: Date;
  initialisedAt?: Date;
  state?: HMSStreamingState;
  stream_type?: HLSStreamType;
}

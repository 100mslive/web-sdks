import { HMSLocalPeer, HMSPeer } from '../sdk/models/peer';
import { ServerError } from './internal';

export enum HMSRoomType {
  DEFAULT,
}

export interface HMSRoom {
  id: string;
  name?: string;
  sessionId?: string;
  startedAt?: Date;
  localPeer: HMSLocalPeer;
  peers: HMSPeer[];
  shareableLink: string;
  type: HMSRoomType;
  hasWaitingRoom: boolean;
  recording: HMSRecording;
  rtmp: HMSRTMP;
  hls: HMSHLS;
  peerCount?: number;
}

export interface HMSRecording {
  browser: {
    running: boolean;
    startedAt?: Date;
    error?: ServerError;
  };
  server: {
    running: boolean;
    startedAt?: Date;
    error?: ServerError;
  };
  hls: HMSHLSRecording;
}

export interface HMSHLSRecording {
  running: boolean;
  startedAt?: Date;
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
  error?: ServerError;
}

export interface HMSHLS {
  running: boolean;
  variants: Array<HLSVariant>;
  error?: ServerError;
}

export interface HLSVariant {
  url: string;
  meetingURL?: string;
  metadata?: string;
  startedAt?: Date;
}

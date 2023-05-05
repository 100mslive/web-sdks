import { ServerError } from './internal';
import { HMSException } from '../error/HMSException';
import { HMSLocalPeer, HMSPeer } from '../sdk/models/peer';

export interface HMSRoom {
  id: string;
  name?: string;
  sessionId?: string;
  joinedAt?: Date;
  startedAt?: Date;
  localPeer: HMSLocalPeer;
  peers: HMSPeer[];
  recording: HMSRecording;
  rtmp: HMSRTMP;
  hls: HMSHLS;
  peerCount?: number;
  templateId?: string;
}

export interface HMSRecording {
  browser: {
    running: boolean;
    startedAt?: Date;
    error?: HMSException;
  };
  server: {
    running: boolean;
    startedAt?: Date;
    error?: HMSException;
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
  error?: HMSException;
}

export interface HMSHLS {
  running: boolean;
  variants: Array<HLSVariant>;
  error?: HMSException;
}

export interface HLSVariant {
  url: string;
  meetingURL?: string;
  metadata?: string;
  startedAt?: Date;
}

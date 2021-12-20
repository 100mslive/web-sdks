import { HMSLocalPeer, HMSPeer } from '../sdk/models/peer';

export enum HMSRoomType {
  DEFAULT,
}

export interface HMSRoom {
  id: string;
  name: string;
  sessionId?: string;
  startedAt?: number;
  localPeer: HMSLocalPeer;
  peers: HMSPeer[];
  shareableLink: string;
  type: HMSRoomType;
  hasWaitingRoom: boolean;
  recording?: HMSRecording;
  rtmp?: HMSRTMP;
  hls?: HMSHLS;
}

export interface HMSRecording {
  browser: {
    running: boolean;
  };
  server: {
    running: boolean;
  };
}

export interface HMSRTMP {
  running: boolean;
  /**
   * @alpha
   **/
  startedAt?: number;
}

export interface HMSHLS {
  running: boolean;
  variants: Array<HLSVariant>;
}

export interface HLSVariant {
  url: string;
  meetingURL?: string;
  metadata?: string;
  startedAt?: number;
}

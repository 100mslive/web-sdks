import { HMSLocalPeer, HMSPeer } from '../sdk/models/peer';

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
  };
  server: {
    running: boolean;
    startedAt?: Date;
  };
}

export interface HMSRTMP {
  running: boolean;
  /**
   * @alpha
   **/
  startedAt?: Date;
}

export interface HMSHLS {
  running: boolean;
  variants: Array<HLSVariant>;
}

export interface HLSVariant {
  url: string;
  meetingURL?: string;
  metadata?: string;
  startedAt?: Date;
}

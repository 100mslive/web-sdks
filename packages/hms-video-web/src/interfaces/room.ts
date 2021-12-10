import { HMSLocalPeer, HMSPeer } from '../sdk/models/peer';

export enum HMSRoomType {
  DEFAULT,
}

export interface HMSRoom {
  id: string;
  name: string;
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
}

export interface HMSHLS {
  running: boolean;
  url: string;
}

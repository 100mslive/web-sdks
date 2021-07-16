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
}

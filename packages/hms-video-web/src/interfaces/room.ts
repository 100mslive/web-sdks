import HMSPeer from './hms-peer';

export enum HMSRoomType {
  DEFAULT,
}

export default interface HMSRoom {
  id: string;
  name: string;
  peers: HMSPeer[];
  shareableLink: string;
  type: HMSRoomType;
  hasWaitingRoom: boolean;
}

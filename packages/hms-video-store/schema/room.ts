import { HMSPeerID } from './peer';

export type HMSRoomID = string;

export interface HMSRoom {
  id: HMSRoomID;
  name: string;
  isConnected?: boolean;
  peers: HMSPeerID[];
  shareableLink: string;
  hasWaitingRoom: boolean;
}

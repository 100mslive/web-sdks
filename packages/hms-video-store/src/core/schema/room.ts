import { HMSPeerID } from './peer';

export type HMSRoomID = string;

export enum HMSRoomState {
  Disconnected = 'Disconnected',
  Preview = 'Preview',
  Connecting = 'Connecting',
  Connected = 'Connected',
  Reconnecting = 'Reconnecting',
  Failed = 'Failed',
}

export interface HMSRoom {
  id: HMSRoomID;
  name: string;
  isConnected?: boolean;
  peers: HMSPeerID[];
  shareableLink: string;
  hasWaitingRoom: boolean;
  roomState: HMSRoomState;
}

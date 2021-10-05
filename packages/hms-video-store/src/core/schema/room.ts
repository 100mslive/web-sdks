import { HMSPeerID } from './peer';
import { HMSRecording, HMSRTMP } from '@100mslive/hms-video';

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
  localPeer: HMSPeerID;
  shareableLink: string;
  hasWaitingRoom: boolean;
  roomState: HMSRoomState;
  recording: HMSRecording;
  rtmp: HMSRTMP;
}

import { HMSRecording, HMSRTMP, HMSHLS } from '@100mslive/hms-video';
import { HMSPeerID } from './peer';

export type HMSRoomID = string;

/**
 * Check out internal-docs/RoomStateFlow.tldr for flow of room state
 * View it by
 * - Installing tldraw for VSCode(https://marketplace.visualstudio.com/items?itemName=tldraw-org.tldraw-vscode), or
 * - Open the file in https://www.tldraw.com/
 */
export enum HMSRoomState {
  Disconnected = 'Disconnected',
  Preview = 'Preview',
  Connecting = 'Connecting',
  Connected = 'Connected',
  Reconnecting = 'Reconnecting',
  Disconnecting = 'Disconnecting',
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
  hls: HMSHLS;
  sessionId: string;
  startedAt?: Date;
  /**
   * if this number is available room.peers is not guaranteed to have all the peers.
   */
  peerCount?: number;
}

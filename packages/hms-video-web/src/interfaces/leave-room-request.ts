import { HMSPeer } from '../sdk/models/peer';

export interface HMSLeaveRoomRequest {
  requestedBy?: HMSPeer;
  reason: string;
  roomEnded: boolean;
}

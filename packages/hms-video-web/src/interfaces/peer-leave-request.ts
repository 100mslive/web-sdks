import { HMSPeer } from '../sdk/models/peer';

export interface HMSPeerLeaveRequest {
  requestedBy: HMSPeer;
  reason: string;
  roomEnded: boolean;
}

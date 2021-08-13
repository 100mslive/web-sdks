import { HMSPeer, HMSPeerID, HMSTrack } from './peer';
import { HMSRoleName } from './role';

export interface HMSRoleChangeStoreRequest {
  requestedBy: HMSPeerID;
  roleName: HMSRoleName;
  token: string;
}

export interface HMSChangeTrackStateRequest {
  requestedBy: HMSPeer;
  track: HMSTrack;
  enabled: boolean;
}

export interface HMSLeaveRoomRequest {
  requestedBy: HMSPeer;
  reason: string;
  roomEnded: boolean;
}

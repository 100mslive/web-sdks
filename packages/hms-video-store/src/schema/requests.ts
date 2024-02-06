import { HMSGroupName, HMSPeer, HMSPeerID, HMSTrack, HMSTrackSource } from './peer';
import { HMSRoleName } from './role';

export interface HMSRoleChangeStoreRequest {
  requestedBy?: HMSPeerID;
  roleName: HMSRoleName;
  token: string;
}

export interface HMSChangeTrackStateRequest {
  requestedBy?: HMSPeer;
  track: HMSTrack;
  enabled: boolean;
}

export interface HMSChangeMultiTrackStateRequest {
  requestedBy?: HMSPeer;
  tracks: HMSTrack[];
  enabled: boolean;
  type?: 'audio' | 'video';
  source?: HMSTrackSource;
}

export interface HMSChangeMultiTrackStateParams {
  enabled: boolean;
  roles?: HMSRoleName[];
  type?: 'audio' | 'video';
  source?: HMSTrackSource;
}

export interface HMSLeaveRoomRequest {
  requestedBy?: HMSPeer;
  reason: string;
  roomEnded: boolean;
}

export interface HMSPeerListIteratorOptions {
  role?: HMSRoleName;
  group?: HMSGroupName;
  peerIds?: string[];
  limit?: number;
}

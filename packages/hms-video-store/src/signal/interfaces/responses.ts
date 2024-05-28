import { HMSPermissionType } from '../../interfaces';
import { FindPeerByNameInfo, PeerNotificationInfo } from '../../notification-manager';

export interface BroadcastResponse {
  timestamp: number;
  message_id: string;
}

export interface GetSessionMetadataResponse {
  change_version?: number;
  updated_by?: string;
  data: any;
  key?: string;
  updated_at?: number;
}

export interface SetSessionMetadataResponse {
  change_version?: number;
  data: any;
  key: string;
  updated_at?: number;
}

export interface JoinLeaveGroupResponse {
  groups: string[];
}

export interface PeersIterationResponse {
  iterator: string;
  total: number;
  eof: boolean;
  peers: PeerNotificationInfo[];
}

export interface FindPeerByNameResponse {
  count: number;
  limit: number;
  offset: number;
  eof: boolean;
  peers: FindPeerByNameInfo[];
}

export interface CreateWhiteboardResponse {
  id: string;
  owner: string;
}

export interface GetWhiteboardResponse {
  id: string;
  addr: string;
  token: string;
  owner: string;
  permissions: Array<HMSPermissionType>;
}

export type { HMSPermissionType };

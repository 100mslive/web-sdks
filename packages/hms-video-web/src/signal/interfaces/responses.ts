import { PeerNotificationInfo } from '../../notification-manager';

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

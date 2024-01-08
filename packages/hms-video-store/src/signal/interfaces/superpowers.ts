import { HMSTrackSource } from '../..';
import { HLSTimedMetadata, RTMPRecordingResolution } from '../../interfaces';

/**
 * Parameteres for the role change request sent to the server.
 */
export interface RequestForRoleChangeParams {
  requested_for: string;
  force: boolean;
  role: string;
}

export interface RequestForBulkRoleChangeParams {
  roles: string[];
  force: boolean;
  role: string;
}

/**
 * Parameters for accepting a role change request sent to the server.
 */
export interface AcceptRoleChangeParams {
  requested_by?: string;
  role: string;
  token: string;
}

export interface RemovePeerRequest {
  requested_for: string;
  reason: string;
}

export interface TrackUpdateRequestParams {
  requested_for: string;
  track_id: string;
  stream_id: string;
  mute: boolean;
}

export interface MultiTrackUpdateRequestParams {
  requested_for?: string;
  roles?: string[];
  type?: 'audio' | 'video';
  source?: HMSTrackSource;
  value: boolean;
}

export interface StartRTMPOrRecordingRequestParams {
  meeting_url?: string;
  rtmp_urls?: Array<string>;
  record: boolean;
  resolution?: RTMPRecordingResolution;
}

export interface UpdatePeerRequestParams {
  name?: string;
  data?: string;
}

export interface SetSessionMetadataParams {
  key?: string;
  data: any;
  if_change_version?: number;
}

export interface HLSRequestParams {
  variants?: Array<HLSVariant>;
  hls_recording?: {
    single_file_per_layer?: boolean; // false by default on server
    hls_vod?: boolean; // false by default on server
  };
}

export interface HLSTimedMetadataParams {
  metadata_objs: HLSTimedMetadata[];
  metadata_id?: string;
}

export interface HLSVariant {
  meeting_url: string;
  metadata?: string;
}

export interface getPeerRequestParams {
  peerId: string;
}

export interface findPeersRequestParams {
  peers?: string[];
  role?: string;
  group?: string;
  limit: number;
}

export interface peerIterRequestParams {
  iterator: string;
  limit: number;
}

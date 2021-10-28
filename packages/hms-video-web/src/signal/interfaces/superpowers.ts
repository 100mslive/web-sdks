import { HMSTrackSource } from '../..';

/**
 * Parameteres for the role change request sent to the server.
 */
export interface RequestForRoleChangeParams {
  requested_for: string;
  force: boolean;
  role: string;
}

/**
 * Parameters for accepting a role change request sent to the server.
 */
export interface AcceptRoleChangeParams {
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
  meeting_url: string;
  rtmp_urls?: Array<string>;
  record: boolean;
}

export interface UpdatePeerMetadataRequestParams {
  name?: string;
  data?: string;
}

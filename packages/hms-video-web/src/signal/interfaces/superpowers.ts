import { HMSTrackSource } from '../..';
import { RTMPRecordingResolution } from '../../interfaces';

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
  resolution?: RTMPRecordingResolution;
}

export interface UpdatePeerRequestParams {
  name?: string;
  data?: string;
}

export interface HLSRequestParams {
  variants: Array<HLSVariant>;
  hls_recording?: {
    single_file_per_layer?: boolean; // false by default on server
    hls_vod?: boolean; // false by default on server
  };
}

export interface HLSTimedMetadataParams {
  metadata_objs: HLSTimedMetadata[]; // Currently only 3 objects can be sent
  metadata_id: string; // Used for dedup checks etc by beam. Currently no-op.
}

export interface HLSTimedMetadata {
  payload: string; // payload string. Max length: 100
  duration: number; // Duration in seconds
}

export interface HLSVariant {
  meeting_url: string;
  metadata?: string;
}

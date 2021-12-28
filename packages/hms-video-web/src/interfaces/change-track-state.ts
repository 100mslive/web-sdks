import { HMSRole } from './role';
import { HMSLocalTrack, HMSTrackSource } from '../media/tracks';
import { HMSRemotePeer } from './peer';

export interface HMSChangeTrackStateRequest {
  requestedBy?: HMSRemotePeer;
  track: HMSLocalTrack;
  enabled: boolean;
}

export interface HMSChangeMultiTrackStateParams {
  enabled: boolean;
  roles?: HMSRole[];
  type?: 'audio' | 'video';
  source?: HMSTrackSource;
}

export interface HMSChangeMultiTrackStateRequest {
  requestedBy?: HMSRemotePeer;
  tracks: HMSLocalTrack[];
  enabled: boolean;
  type?: 'audio' | 'video';
  source?: HMSTrackSource;
}

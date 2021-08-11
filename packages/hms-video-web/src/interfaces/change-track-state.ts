import { HMSLocalTrack } from '../media/tracks';
import { HMSRemotePeer } from './peer';

export interface HMSChangeTrackStateRequest {
  requestedBy: HMSRemotePeer;
  track: HMSLocalTrack;
  enabled: boolean;
}

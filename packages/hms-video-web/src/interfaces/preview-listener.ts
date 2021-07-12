import { HMSException } from '../error/HMSException';
import { HMSTrack } from '../media/tracks/HMSTrack';
import HMSRoom from './room';

export interface HMSPreviewListener {
  onPreview(room: HMSRoom, localTracks: HMSTrack[]): void;
  onError(exception: HMSException): void;
}

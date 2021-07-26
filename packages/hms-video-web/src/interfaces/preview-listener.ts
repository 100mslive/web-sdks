import { HMSException } from '../error/HMSException';
import { HMSTrack } from '../media/tracks/HMSTrack';
import { DeviceChangeListener } from './device-change-listener';
import { HMSRoom } from './room';

export interface HMSPreviewListener extends DeviceChangeListener {
  onPreview(room: HMSRoom, localTracks: HMSTrack[]): void;
  onError(exception: HMSException): void;
}

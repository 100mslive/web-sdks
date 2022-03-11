import { HMSException } from '../error/HMSException';
import { HMSTrack } from '../media/tracks/HMSTrack';
import { DeviceChangeListener } from './device-change-listener';
import { HMSPeer } from './peer';
import { HMSRoom } from './room';
import { HMSRoomUpdate, HMSPeerUpdate } from './update-listener';

export interface HMSPreviewListener extends DeviceChangeListener {
  onPreview(room: HMSRoom, localTracks: HMSTrack[]): void;
  onError(exception: HMSException): void;
  onRoomUpdate(type: HMSRoomUpdate, room: HMSRoom): void;
  onPeerUpdate(type: HMSPeerUpdate, peer: HMSPeer | HMSPeer[] | null): void;
  onNetworkQuality?(score: number): void;
}
